import React, { useState, useCallback } from 'react'
import Header from './components/Header'
import ProductTable from './components/ProductTable'
import Summary from './components/Summary'
import './App.css'

const newRow = (id) => ({
  id,
  produto: '',
  sku: '',
  filamento: '',
  tempo_h: '',
  tempo_m: '',
  margem: '100',
  preco_vendido: '',
  link_shopee: '',
  link_projeto: '',
})

export default function App() {
  const [rows, setRows] = useState([newRow(1), newRow(2), newRow(3)])
  const [nextId, setNextId] = useState(4)
  const [electricidade, setEletricidade] = useState('0.80')
  const [filamentoCusto, setFilamentoCusto] = useState('0.12')

  const addRow = useCallback(() => {
    setRows(r => [...r, newRow(nextId)])
    setNextId(n => n + 1)
  }, [nextId])

  const removeRow = useCallback((id) => {
    setRows(r => r.filter(row => row.id !== id))
  }, [])

  const updateRow = useCallback((id, field, value) => {
    setRows(r => r.map(row => row.id === id ? { ...row, [field]: value } : row))
  }, [])

  const duplicateRow = useCallback((id) => {
    setRows(r => {
      const idx = r.findIndex(row => row.id === id)
      const copy = { ...r[idx], id: nextId, sku: '' }
      const next = [...r]
      next.splice(idx + 1, 0, copy)
      return next
    })
    setNextId(n => n + 1)
  }, [nextId])

  return (
    <div className="app">
      <Header />
      <main className="main">
        <div className="config-bar">
          <div className="config-group">
            <label>Custo filamento (R$/g)</label>
            <div className="input-prefix">
              <span>R$</span>
              <input
                type="number"
                step="0.01"
                min="0"
                value={filamentoCusto}
                onChange={e => setFilamentoCusto(e.target.value)}
              />
            </div>
          </div>
          <div className="config-group">
            <label>Energia elétrica (R$/h)</label>
            <div className="input-prefix">
              <span>R$</span>
              <input
                type="number"
                step="0.01"
                min="0"
                value={electricidade}
                onChange={e => setEletricidade(e.target.value)}
              />
            </div>
          </div>
          <div className="config-hint">
            Custo produção = (filamento × g) + (energia × horas)
          </div>
        </div>

        <Summary rows={rows} filamentoCusto={filamentoCusto} electricidade={electricidade} />

        <ProductTable
          rows={rows}
          filamentoCusto={filamentoCusto}
          electricidade={electricidade}
          onUpdate={updateRow}
          onRemove={removeRow}
          onDuplicate={duplicateRow}
          onAdd={addRow}
        />
      </main>
    </div>
  )
}
