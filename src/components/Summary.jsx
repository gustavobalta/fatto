import React from 'react'
import { calcLinha, fmt } from '../utils/pricing'
import './Summary.css'

export default function Summary({ rows, cfg }) {
  const calcs = rows.map((r) => calcLinha(r, cfg))
  const vendidos = calcs.filter((c) => c.lucro !== null)
  const media = (xs) => (xs.length ? xs.reduce((s, x) => s + x, 0) / xs.length : 0)

  const lucroMedio = media(vendidos.map((c) => c.lucro))
  const margemMedia = media(vendidos.map((c) => c.margem_venda_final))
  const abaixo = calcs.filter((c) => c.status === 'atencao' || c.status === 'critico').length
  const prejuizo = vendidos.filter((c) => c.lucro < 0).length

  const cards = [
    { label: 'Produtos cadastrados', value: rows.length, color: '#4a90d9' },
    { label: 'Com preço de venda', value: vendidos.length, color: '#8a7b6b' },
    { label: 'Lucro médio por venda', value: `R$ ${fmt(lucroMedio)}`, color: lucroMedio >= 0 ? '#4caf7d' : '#e05555' },
    { label: 'Margem média (após taxas)', value: `${fmt(margemMedia)}%`, color: margemMedia >= 25 ? '#4caf7d' : '#f5a623' },
    { label: 'Abaixo de 25% de margem', value: abaixo, color: abaixo ? '#e08c2a' : '#4caf7d' },
    { label: 'Vendendo no prejuízo', value: prejuizo, color: prejuizo ? '#e05555' : '#4caf7d' },
  ]

  return (
    <div className="summary">
      {cards.map((c) => (
        <div className="summary-card" key={c.label}>
          <div className="summary-value" style={{ color: c.color }}>{c.value}</div>
          <div className="summary-label">{c.label}</div>
        </div>
      ))}
    </div>
  )
}
