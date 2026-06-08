import React from 'react'
import { calcRow, fmt } from '../utils/calc'
import './Summary.css'

export default function Summary({ rows, electricidade }) {
  const calcs = rows.map(r => calcRow(r, electricidade))
  const filled = rows.filter(r => parseFloat(r.preco_vendido) > 0)
  const filledCalcs = calcs.filter((_, i) => parseFloat(rows[i].preco_vendido) > 0)

  const totalCusto = calcs.reduce((s, c) => s + c.custo, 0)
  const totalReceita = filled.reduce((s, r) => s + parseFloat(r.preco_vendido), 0)
  const totalLucro = filledCalcs.reduce((s, c) => s + c.lucro, 0)
  const avgMargem = filledCalcs.length > 0
    ? filledCalcs.reduce((s, c) => s + c.margem_venda_final, 0) / filledCalcs.length
    : 0

  const cards = [
    { label: 'Produtos cadastrados', value: rows.length, unit: '', color: '#4a90d9' },
    { label: 'Custo total produção', value: `R$ ${fmt(totalCusto)}`, unit: '', color: '#8a7b6b' },
    { label: 'Receita total', value: `R$ ${fmt(totalReceita)}`, unit: '', color: '#4caf7d' },
    { label: 'Lucro total', value: `R$ ${fmt(totalLucro)}`, unit: '', color: totalLucro >= 0 ? '#4caf7d' : '#e05555' },
    { label: 'Margem média (venda)', value: `${fmt(avgMargem)}%`, unit: '', color: avgMargem >= 40 ? '#4caf7d' : '#f5a623' },
  ]

  return (
    <div className="summary">
      {cards.map(c => (
        <div className="summary-card" key={c.label}>
          <div className="summary-value" style={{ color: c.color }}>{c.value}</div>
          <div className="summary-label">{c.label}</div>
        </div>
      ))}
    </div>
  )
}
