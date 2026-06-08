import React, { useState } from 'react'
import { fmt, STATUS_LABELS, STATUS_COLORS } from '../utils/calc'
import './Simulador.css'

const INITIAL = {
  produto: '',
  filamento: '',
  custo_filamento_g: '0.115',
  tempo_h: '',
  tempo_m: '',
  electricidade: '0.80',
  margem: '100',
  preco_vendido: '',
}

function calc(s) {
  const g = parseFloat(s.filamento) || 0
  const h = (parseInt(s.tempo_h) || 0) + (parseInt(s.tempo_m) || 0) / 60
  const custoPorGrama = parseFloat(s.custo_filamento_g) || 0
  const energia = parseFloat(s.electricidade) || 0
  const margem = (parseFloat(s.margem) || 0) / 100
  const preco_vendido = parseFloat(s.preco_vendido) || 0

  const custo = g * custoPorGrama + h * energia
  const preco_sugerido = custo * (1 + margem)
  const lucro = preco_vendido - custo
  const margem_custo = custo > 0 ? (lucro / custo) * 100 : 0
  const margem_venda = preco_vendido > 0 ? (lucro / preco_vendido) * 100 : 0

  let status = null
  if (preco_vendido > 0) {
    if (margem_venda >= 55) status = 'excelente'
    else if (margem_venda >= 40) status = 'saudavel'
    else if (margem_venda >= 20) status = 'atencao'
    else status = 'critico'
  }

  return { custo, preco_sugerido, lucro, margem_custo, margem_venda, status }
}

function Field({ label, children, hint }) {
  return (
    <div className="sim-field">
      <label className="sim-label">{label}</label>
      {children}
      {hint && <span className="sim-hint">{hint}</span>}
    </div>
  )
}

export default function Simulador() {
  const [s, setS] = useState(INITIAL)
  const set = (k) => (e) => setS(prev => ({ ...prev, [k]: e.target.value }))
  const reset = () => setS(INITIAL)

  const c = calc(s)
  const hasResult = (parseFloat(s.filamento) > 0 || parseFloat(s.tempo_h) > 0 || parseFloat(s.tempo_m) > 0)

  return (
    <div className="sim-wrap">
      <div className="sim-card">
        <div className="sim-card-header">
          <h2 className="sim-title">Simulador de Preço</h2>
          <p className="sim-desc">Teste rapidamente se um produto vai ser lucrativo antes de cadastrar.</p>
        </div>

        <div className="sim-body">
          <div className="sim-inputs">
            <Field label="Nome do produto (opcional)">
              <input className="sim-input" type="text" placeholder="Ex: Vaso decorativo" value={s.produto} onChange={set('produto')} />
            </Field>

            <div className="sim-row">
              <Field label="Filamento (g)" hint="Peso gasto na impressão">
                <input className="sim-input" type="number" min="0" step="0.1" placeholder="0" value={s.filamento} onChange={set('filamento')} />
              </Field>
              <Field label="Custo do filamento (R$/g)" hint="Ex: 1kg por R$115 = 0,115">
                <div className="sim-prefix">
                  <span>R$</span>
                  <input className="sim-input" type="number" min="0" step="0.001" placeholder="0.115" value={s.custo_filamento_g} onChange={set('custo_filamento_g')} />
                </div>
              </Field>
            </div>

            <div className="sim-row">
              <Field label="Tempo de impressão">
                <div className="sim-tempo">
                  <input className="sim-input" type="number" min="0" placeholder="0h" value={s.tempo_h} onChange={set('tempo_h')} />
                  <span>:</span>
                  <input className="sim-input" type="number" min="0" max="59" placeholder="00m" value={s.tempo_m} onChange={set('tempo_m')} />
                </div>
              </Field>
              <Field label="Energia elétrica (R$/h)" hint="Custo da impressora por hora">
                <div className="sim-prefix">
                  <span>R$</span>
                  <input className="sim-input" type="number" min="0" step="0.01" placeholder="0.80" value={s.electricidade} onChange={set('electricidade')} />
                </div>
              </Field>
            </div>

            <div className="sim-row">
              <Field label="Margem desejada" hint="Quanto quer ganhar sobre o custo">
                <div className="sim-prefix">
                  <input className="sim-input" type="number" min="0" step="1" placeholder="100" value={s.margem} onChange={set('margem')} />
                  <span>%</span>
                </div>
              </Field>
              <Field label="Preço que pretende vender" hint="Deixe vazio para ver só o sugerido">
                <div className="sim-prefix">
                  <span>R$</span>
                  <input className="sim-input" type="number" min="0" step="0.01" placeholder="0,00" value={s.preco_vendido} onChange={set('preco_vendido')} />
                </div>
              </Field>
            </div>

            <button className="sim-reset" onClick={reset}>Limpar</button>
          </div>

          {hasResult && (
            <div className="sim-results">
              <div className="sim-result-title">Resultado</div>

              <div className="sim-result-row">
                <span>Custo de produção</span>
                <strong>R$ {fmt(c.custo)}</strong>
              </div>
              <div className="sim-result-row sim-result-highlight">
                <span>Preço sugerido ({s.margem || 0}% margem)</span>
                <strong className="sim-suggested">R$ {fmt(c.preco_sugerido)}</strong>
              </div>

              {parseFloat(s.preco_vendido) > 0 && (
                <>
                  <div className="sim-divider" />
                  <div className="sim-result-row">
                    <span>Lucro</span>
                    <strong style={{ color: c.lucro >= 0 ? '#2e7d52' : '#c0392b' }}>R$ {fmt(c.lucro)}</strong>
                  </div>
                  <div className="sim-result-row">
                    <span>Margem sobre custo</span>
                    <strong>{fmt(c.margem_custo)}%</strong>
                  </div>
                  <div className="sim-result-row">
                    <span>Margem sobre venda</span>
                    <strong>{fmt(c.margem_venda)}%</strong>
                  </div>

                  {c.status && (
                    <div className="sim-status" style={{ background: STATUS_COLORS[c.status] + '18', borderColor: STATUS_COLORS[c.status] + '44' }}>
                      <span className="sim-status-dot" style={{ background: STATUS_COLORS[c.status] }} />
                      <span style={{ color: STATUS_COLORS[c.status], fontWeight: 700 }}>{STATUS_LABELS[c.status]}</span>
                      <span className="sim-status-desc">
                        {c.status === 'excelente' && '— margem acima de 55%, ótimo negócio!'}
                        {c.status === 'saudavel' && '— margem entre 40–55%, produto viável.'}
                        {c.status === 'atencao' && '— margem baixa (20–40%), considere ajustar o preço.'}
                        {c.status === 'critico' && '— margem abaixo de 20%, reveja os custos ou o preço.'}
                      </span>
                    </div>
                  )}
                </>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
