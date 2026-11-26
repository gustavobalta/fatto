import React, { useState, useEffect, useRef, useCallback } from 'react'
import Header from './components/Header'
import ProductTable from './components/ProductTable'
import Summary from './components/Summary'
import Simulador from './components/Simulador'
import ConfigBar from './components/ConfigBar'
import Login from './components/Login'
import { supabase } from './lib/supabase'
import { CONFIG_PADRAO, num } from './utils/pricing'
import './App.css'

// Cada linha tem uma `key` local estável (chave do React e da fila de salvamento).
// O id do banco fica em idPorChave, preenchido quando o insert termina.
let seq = 0
const novaChave = () => `k${++seq}`

const newRow = (dados = {}) => ({
  key: novaChave(),
  produto: '',
  sku: '',
  filamento: '',
  custo_filamento_g: '0.115',
  tempo_h: '',
  tempo_m: '',
  margem: '100',
  preco_vendido: '',
  link_shopee: '',
  link_projeto: '',
  ...dados,
})

const inteiro = (v) => Math.max(0, Math.trunc(num(v)))

function rowToDb(row, ordem) {
  return {
    ordem,
    produto: row.produto || null,
    sku: row.sku || null,
    filamento: num(row.filamento, 0),
    custo_filamento_g: num(row.custo_filamento_g, CONFIG_PADRAO.custoFilamentoG),
    tempo_h: inteiro(row.tempo_h),
    tempo_m: inteiro(row.tempo_m),
    margem: num(row.margem, 100),
    preco_vendido: num(row.preco_vendido, 0),
    link_shopee: row.link_shopee || null,
    link_projeto: row.link_projeto || null,
  }
}

const texto = (v) => (v === null || v === undefined ? '' : String(v))

function dbToRow(r) {
  return newRow({
    produto: texto(r.produto),
    sku: texto(r.sku),
    filamento: texto(r.filamento),
    custo_filamento_g: texto(r.custo_filamento_g ?? CONFIG_PADRAO.custoFilamentoG),
    tempo_h: texto(r.tempo_h),
    tempo_m: texto(r.tempo_m),
    margem: texto(r.margem ?? 100),
    preco_vendido: r.preco_vendido ? texto(r.preco_vendido) : '',
    link_shopee: texto(r.link_shopee),
    link_projeto: texto(r.link_projeto),
  })
}

function carregarConfig() {
  try {
    return { ...CONFIG_PADRAO, ...JSON.parse(localStorage.getItem('fl_config') || '{}') }
  } catch {
    return { ...CONFIG_PADRAO }
  }
}

export default function App() {
  // undefined = verificando sessão; null = deslogado
  const [session, setSession] = useState(undefined)
  const [rows, setRows] = useState([])
  const [carga, setCarga] = useState('carregando') // carregando | ok | erro
  const [estado, setEstado] = useState('salvo')    // salvo | pendente | salvando | erro
  const [aba, setAba] = useState('produtos')
  const [cfg, setCfg] = useState(carregarConfig)

  const rowsRef = useRef([])
  const idPorChave = useRef(new Map())
  const sujas = useRef(new Set())
  const exclusoes = useRef([])
  const timer = useRef(null)
  const rodando = useRef(false)
  const deNovo = useRef(false)

  useEffect(() => { localStorage.setItem('fl_config', JSON.stringify(cfg)) }, [cfg])

  useEffect(() => {
    sessionStorage.removeItem('fl_auth') // resto do login antigo
    supabase.auth.getSession().then(({ data }) => setSession(data.session))
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_evento, s) => setSession(s))
    return () => subscription.unsubscribe()
  }, [])

  const userId = session?.user?.id
  useEffect(() => {
    clearTimeout(timer.current)
    sujas.current.clear()
    exclusoes.current = []
    idPorChave.current = new Map()
    trocar([])
    if (userId) load()
  }, [userId])

  // Avisa antes de fechar a aba com alteração ainda não gravada.
  useEffect(() => {
    if (estado === 'salvo') return
    const aviso = (e) => { e.preventDefault(); e.returnValue = '' }
    window.addEventListener('beforeunload', aviso)
    return () => window.removeEventListener('beforeunload', aviso)
  }, [estado])

  function trocar(next) {
    rowsRef.current = next
    setRows(next)
  }

  async function load() {
    setCarga('carregando')
    const { data, error } = await supabase.from('produtos').select('*').order('ordem')
    if (error) { setCarga('erro'); return }
    const linhas = data.map((r) => {
      const row = dbToRow(r)
      idPorChave.current.set(row.key, r.id)
      return row
    })
    trocar(linhas.length > 0 ? linhas : [newRow(), newRow(), newRow()])
    setEstado('salvo')
    setCarga('ok')
  }

  function marcar(chaves) {
    chaves.forEach((k) => sujas.current.add(k))
    setEstado('pendente')
    clearTimeout(timer.current)
    timer.current = setTimeout(salvar, 1000)
  }

  // Fila serial: um salvamento por vez, só das linhas alteradas.
  async function salvar() {
    clearTimeout(timer.current)
    if (rodando.current) { deNovo.current = true; return }
    rodando.current = true
    deNovo.current = false
    setEstado('salvando')
    let falhou = false
    const chaves = [...sujas.current]
    sujas.current.clear()
    let i = 0
    try {
      while (exclusoes.current.length) {
        const key = exclusoes.current[0]
        const id = idPorChave.current.get(key)
        if (id != null) {
          const { error } = await supabase.from('produtos').delete().eq('id', id)
          if (error) throw error
        }
        idPorChave.current.delete(key)
        exclusoes.current.shift()
      }
      for (; i < chaves.length; i++) {
        const key = chaves[i]
        const idx = rowsRef.current.findIndex((r) => r.key === key)
        if (idx < 0) continue // removida enquanto esperava
        const db = rowToDb(rowsRef.current[idx], idx + 1)
        const id = idPorChave.current.get(key)
        if (id == null) {
          const { data, error } = await supabase.from('produtos').insert(db).select('id').single()
          if (error) throw error
          idPorChave.current.set(key, data.id)
        } else {
          const { error } = await supabase.from('produtos').update(db).eq('id', id)
          if (error) throw error
        }
      }
    } catch (e) {
      console.error('Erro ao salvar', e)
      falhou = true
      chaves.slice(i).forEach((k) => sujas.current.add(k))
    } finally {
      rodando.current = false
    }
    const pendente = sujas.current.size > 0 || exclusoes.current.length > 0
    if (falhou) {
      setEstado('erro')
      timer.current = setTimeout(salvar, 5000)
    } else if (pendente || deNovo.current) {
      salvar()
    } else {
      setEstado('salvo')
    }
  }

  const chavesDesde = (lista, idx) => lista.slice(idx).map((r) => r.key)

  const addRow = useCallback((dados) => {
    const row = newRow(dados)
    trocar([...rowsRef.current, row])
    // Linha vazia só vai para o banco quando for editada.
    if (dados) marcar([row.key])
    return row.key
  }, [])

  const removeRow = useCallback((key) => {
    const lista = rowsRef.current
    const idx = lista.findIndex((r) => r.key === key)
    if (idx < 0) return
    const nome = lista[idx].produto
    if (!window.confirm(nome ? `Remover "${nome}"?` : 'Remover esta linha?')) return
    const next = lista.filter((r) => r.key !== key)
    trocar(next)
    sujas.current.delete(key)
    exclusoes.current.push(key)
    marcar(chavesDesde(next, idx).filter((k) => idPorChave.current.has(k))) // reordena as de baixo
  }, [])

  const updateRow = useCallback((key, field, value) => {
    trocar(rowsRef.current.map((r) => (r.key === key ? { ...r, [field]: value } : r)))
    marcar([key])
  }, [])

  const duplicateRow = useCallback((key) => {
    const lista = rowsRef.current
    const idx = lista.findIndex((r) => r.key === key)
    if (idx < 0) return
    const { key: _k, ...dados } = lista[idx]
    const next = [...lista]
    next.splice(idx + 1, 0, newRow({ ...dados, sku: '' }))
    trocar(next)
    marcar(chavesDesde(next, idx + 1))
  }, [])

  function adicionarDoSimulador(dados) {
    addRow(dados)
    setAba('produtos')
  }

  async function logout() {
    if (estado !== 'salvo' && !window.confirm('Há alterações ainda não salvas. Sair mesmo assim?')) return
    clearTimeout(timer.current)
    await supabase.auth.signOut()
  }

  if (session === undefined) return <div className="loading">Carregando...</div>
  if (!session) return <Login />

  return (
    <div className="app">
      <Header estado={estado} aba={aba} onAba={setAba} onLogout={logout} />
      <main className="main">
        <ConfigBar cfg={cfg} onChange={setCfg} />

        {aba === 'simulador' ? (
          <Simulador cfg={cfg} onAdicionar={adicionarDoSimulador} />
        ) : carga === 'carregando' ? (
          <div className="loading">Carregando dados...</div>
        ) : carga === 'erro' ? (
          <div className="loading">
            Não foi possível carregar os produtos.{' '}
            <button className="btn-retry" onClick={load}>Tentar de novo</button>
          </div>
        ) : (
          <>
            <Summary rows={rows} cfg={cfg} />
            <ProductTable
              rows={rows}
              cfg={cfg}
              onUpdate={updateRow}
              onRemove={removeRow}
              onDuplicate={duplicateRow}
              onAdd={() => addRow()}
            />
          </>
        )}
      </main>
    </div>
  )
}
