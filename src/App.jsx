import React, { useState, useCallback, useEffect, useRef } from 'react'
import Header from './components/Header'
import ProductTable from './components/ProductTable'
import Summary from './components/Summary'
import Simulador from './components/Simulador'
import { supabase } from './lib/supabase'
import './App.css'

let localIdCounter = -1
const tempId = () => localIdCounter--

const newRow = (ordem) => ({
  id: tempId(),
  _isNew: true,
  ordem,
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
})

function rowToDb(row) {
  return {
    ...(row._isNew ? {} : { id: row.id }),
    ordem: row.ordem,
    produto: row.produto || null,
    sku: row.sku || null,
    filamento: parseFloat(row.filamento) || 0,
    custo_filamento_g: parseFloat(row.custo_filamento_g) || 0.115,
    tempo_h: parseInt(row.tempo_h) || 0,
    tempo_m: parseInt(row.tempo_m) || 0,
    margem: parseFloat(row.margem) || 100,
    preco_vendido: parseFloat(row.preco_vendido) || 0,
    link_shopee: row.link_shopee || null,
    link_projeto: row.link_projeto || null,
  }
}

function dbToRow(r) {
  return {
    id: r.id,
    _isNew: false,
    ordem: r.ordem,
    produto: r.produto || '',
    sku: r.sku || '',
    filamento: r.filamento?.toString() || '',
    custo_filamento_g: r.custo_filamento_g?.toString() || '0.115',
    tempo_h: r.tempo_h?.toString() || '',
    tempo_m: r.tempo_m?.toString() || '',
    margem: r.margem?.toString() || '100',
    preco_vendido: r.preco_vendido?.toString() || '',
    link_shopee: r.link_shopee || '',
    link_projeto: r.link_projeto || '',
  }
}

export default function App() {
  const [rows, setRows] = useState([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState(null)
  const [aba, setAba] = useState('produtos')
  const [electricidade, setEletricidade] = useState('0.80')
  const saveTimer = useRef(null)

  useEffect(() => { load() }, [])

  async function load() {
    setLoading(true)
    setError(null)
    const { data, error } = await supabase
      .from('produtos')
      .select('*')
      .order('ordem')
    if (error) {
      setError('Erro ao carregar dados.')
    } else {
      setRows(data.length > 0 ? data.map(dbToRow) : [newRow(1), newRow(2), newRow(3)])
    }
    setLoading(false)
  }

  function scheduleSave(updatedRows) {
    clearTimeout(saveTimer.current)
    saveTimer.current = setTimeout(() => saveAll(updatedRows), 1200)
  }

  async function saveAll(updatedRows) {
    setSaving(true)
    setError(null)

    const existing = updatedRows.filter(r => !r._isNew)
    const created = updatedRows.filter(r => r._isNew)

    // Atualiza linhas existentes
    if (existing.length > 0) {
      const { error } = await supabase
        .from('produtos')
        .upsert(existing.map((r, i) => rowToDb({ ...r, ordem: updatedRows.indexOf(r) + 1 })), { onConflict: 'id' })
      if (error) { setError('Erro ao salvar.'); setSaving(false); return }
    }

    // Insere linhas novas e pega os ids gerados
    if (created.length > 0) {
      const { data, error } = await supabase
        .from('produtos')
        .insert(created.map(r => rowToDb({ ...r, ordem: updatedRows.indexOf(r) + 1 })))
        .select()
      if (error) { setError('Erro ao salvar.'); setSaving(false); return }
      if (data) {
        setRows(prev => {
          let newIdx = 0
          return prev.map(row => {
            if (row._isNew && data[newIdx]) {
              const updated = { ...row, id: data[newIdx].id, _isNew: false }
              newIdx++
              return updated
            }
            return row
          })
        })
      }
    }

    setSaving(false)
  }

  const updateRows = useCallback((fn) => {
    setRows(prev => {
      const next = fn(prev)
      scheduleSave(next)
      return next
    })
  }, [])

  const addRow = useCallback(() => {
    updateRows(r => [...r, newRow(r.length + 1)])
  }, [updateRows])

  const removeRow = useCallback(async (id) => {
    const row = rows.find(r => r.id === id)
    if (row && !row._isNew) {
      await supabase.from('produtos').delete().eq('id', id)
    }
    setRows(prev => prev.filter(r => r.id !== id))
  }, [rows])

  const updateRow = useCallback((id, field, value) => {
    updateRows(r => r.map(row => row.id === id ? { ...row, [field]: value } : row))
  }, [updateRows])

  const duplicateRow = useCallback((id) => {
    updateRows(r => {
      const idx = r.findIndex(row => row.id === id)
      const copy = { ...r[idx], id: tempId(), _isNew: true, sku: '' }
      const next = [...r]
      next.splice(idx + 1, 0, copy)
      return next
    })
  }, [updateRows])

  return (
    <div className="app">
      <Header saving={saving} error={error} aba={aba} onAba={setAba} />
      <main className="main">
        <div className="config-bar">
          <div className="config-group">
            <label>Energia elétrica (R$/h)</label>
            <div className="input-prefix">
              <span>R$</span>
              <input type="number" step="0.01" min="0" value={electricidade}
                onChange={e => setEletricidade(e.target.value)} />
            </div>
          </div>
          <div className="config-hint">
            Custo produção = (R$/g × gramas) + (R$/h × horas) — filamento configurado por produto
          </div>
        </div>

        {aba === 'simulador' ? (
          <Simulador />
        ) : loading ? (
          <div className="loading">Carregando dados...</div>
        ) : (
          <>
            <Summary rows={rows} electricidade={electricidade} />
            <ProductTable
              rows={rows}
              electricidade={electricidade}
              onUpdate={updateRow}
              onRemove={removeRow}
              onDuplicate={duplicateRow}
              onAdd={addRow}
            />
          </>
        )}
      </main>
    </div>
  )
}
