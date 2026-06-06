import React from 'react'
import { calcRow, fmt, STATUS_LABELS, STATUS_COLORS } from '../utils/calc'
import './ProductTable.css'

function Cell({ children, className = '' }) {
  return <td className={`td ${className}`}>{children}</td>
}

function EditableCell({ value, onChange, type = 'text', placeholder = '', min, step, className = '' }) {
  return (
    <td className={`td td-edit ${className}`}>
      <input
        className="cell-input"
        type={type}
        value={value}
        placeholder={placeholder}
        min={min}
        step={step}
        onChange={e => onChange(e.target.value)}
      />
    </td>
  )
}

function StatusBadge({ status }) {
  if (!status) return <span className="badge badge-empty">—</span>
  return (
    <span className="badge" style={{ background: STATUS_COLORS[status] + '22', color: STATUS_COLORS[status], borderColor: STATUS_COLORS[status] + '55' }}>
      <span className="badge-dot" style={{ background: STATUS_COLORS[status] }} />
      {STATUS_LABELS[status]}
    </span>
  )
}

function MargemCell({ value, status }) {
  const color = status ? STATUS_COLORS[status] : 'var(--text-muted)'
  const bg = status ? STATUS_COLORS[status] + '11' : 'transparent'
  return (
    <td className="td" style={{ background: bg }}>
      <span style={{ color, fontWeight: 600 }}>{value > 0 || value < 0 ? `${fmt(value)}%` : '—'}</span>
    </td>
  )
}

export default function ProductTable({ rows, filamentoCusto, electricidade, onUpdate, onRemove, onDuplicate, onAdd }) {
  const update = (id, field) => (val) => onUpdate(id, field, val)

  return (
    <div className="table-wrap">
      <div className="table-header-bar">
        <h2 className="table-title">Produtos</h2>
        <button className="btn-add" onClick={onAdd}>+ Adicionar produto</button>
      </div>
      <div className="table-scroll">
        <table className="table">
          <thead>
            <tr>
              <th className="th th-sm">#</th>
              <th className="th">Produto</th>
              <th className="th th-sm">SKU</th>
              <th className="th th-num">Filamento (g)</th>
              <th className="th th-num">Tempo (h:m)</th>
              <th className="th th-num">Custo prod. (R$)</th>
              <th className="th th-num">Margem desejada</th>
              <th className="th th-num">Preço sugerido</th>
              <th className="th th-num">Preço vendido</th>
              <th className="th th-num">Lucro (R$)</th>
              <th className="th th-num">Margem/custo</th>
              <th className="th th-num">Margem/venda</th>
              <th className="th">Status</th>
              <th className="th">Links</th>
              <th className="th th-actions">Ações</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row, idx) => {
              const c = calcRow(row, filamentoCusto, electricidade)
              return (
                <tr key={row.id} className="tr">
                  <Cell className="td-idx">{idx + 1}</Cell>

                  <EditableCell
                    value={row.produto}
                    onChange={update(row.id, 'produto')}
                    placeholder="Nome do produto"
                    className="td-name"
                  />

                  <EditableCell
                    value={row.sku}
                    onChange={update(row.id, 'sku')}
                    placeholder="FL01"
                    className="td-sku"
                  />

                  <EditableCell
                    value={row.filamento}
                    onChange={update(row.id, 'filamento')}
                    type="number"
                    min="0"
                    step="0.01"
                    placeholder="0"
                    className="td-num"
                  />

                  {/* Tempo h:m */}
                  <td className="td td-edit td-num">
                    <div className="tempo-wrap">
                      <input
                        className="cell-input cell-input-sm"
                        type="number"
                        min="0"
                        placeholder="0h"
                        value={row.tempo_h}
                        onChange={e => update(row.id, 'tempo_h')(e.target.value)}
                      />
                      <span className="tempo-sep">:</span>
                      <input
                        className="cell-input cell-input-sm"
                        type="number"
                        min="0"
                        max="59"
                        placeholder="00m"
                        value={row.tempo_m}
                        onChange={e => update(row.id, 'tempo_m')(e.target.value)}
                      />
                    </div>
                  </td>

                  <Cell className="td-num td-calc">R$ {fmt(c.custo)}</Cell>

                  {/* Margem desejada */}
                  <td className="td td-edit td-num">
                    <div className="pct-wrap">
                      <input
                        className="cell-input"
                        type="number"
                        min="0"
                        step="1"
                        placeholder="100"
                        value={row.margem}
                        onChange={e => update(row.id, 'margem')(e.target.value)}
                      />
                      <span className="pct-sym">%</span>
                    </div>
                  </td>

                  <Cell className="td-num td-calc td-suggested">R$ {fmt(c.preco_sugerido)}</Cell>

                  {/* Preço vendido */}
                  <td className="td td-edit td-num">
                    <div className="pct-wrap">
                      <span className="pct-sym pct-sym-left">R$</span>
                      <input
                        className="cell-input"
                        type="number"
                        min="0"
                        step="0.01"
                        placeholder="0,00"
                        value={row.preco_vendido}
                        onChange={e => update(row.id, 'preco_vendido')(e.target.value)}
                      />
                    </div>
                  </td>

                  <Cell className={`td-num td-calc ${c.lucro < 0 ? 'td-neg' : 'td-pos'}`}>
                    R$ {fmt(c.lucro)}
                  </Cell>

                  <Cell className="td-num td-calc">
                    {c.custo > 0 ? `${fmt(c.margem_custo_final)}%` : '—'}
                  </Cell>

                  <MargemCell value={c.margem_venda_final} status={c.status} />

                  <Cell>
                    <StatusBadge status={c.status} />
                  </Cell>

                  {/* Links */}
                  <td className="td">
                    <div className="links-wrap">
                      <input
                        className="cell-input link-input"
                        type="url"
                        placeholder="Shopee"
                        value={row.link_shopee}
                        onChange={e => update(row.id, 'link_shopee')(e.target.value)}
                      />
                      <input
                        className="cell-input link-input"
                        type="url"
                        placeholder="MakerWorld"
                        value={row.link_projeto}
                        onChange={e => update(row.id, 'link_projeto')(e.target.value)}
                      />
                      <div className="link-icons">
                        {row.link_shopee && <a href={row.link_shopee} target="_blank" rel="noreferrer" className="link-btn">🛒</a>}
                        {row.link_projeto && <a href={row.link_projeto} target="_blank" rel="noreferrer" className="link-btn">🔗</a>}
                      </div>
                    </div>
                  </td>

                  <Cell className="td-actions">
                    <button className="btn-icon btn-dup" title="Duplicar" onClick={() => onDuplicate(row.id)}>⧉</button>
                    <button className="btn-icon btn-del" title="Remover" onClick={() => onRemove(row.id)}>×</button>
                  </Cell>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
      <div className="table-footer">
        <button className="btn-add-bottom" onClick={onAdd}>+ Adicionar produto</button>
      </div>
    </div>
  )
}
