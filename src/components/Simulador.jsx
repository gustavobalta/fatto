import React, { useState } from 'react'
import { supabase } from '../lib/supabase'
import {
  CANAIS, custoProducao, horas, num, precoParaLucro, precoSugerido, venda, statusMargem,
  fmt, fmtHoras, STATUS_LABELS, STATUS_COLORS, STATUS_DESC,
} from '../utils/pricing'
import { parseLink, parseDesign, apiUrl, melhorPerfilA1Mini } from '../utils/makerworld'
import './Simulador.css'

const INITIAL = {
  produto: '',
  filamento: '',
  custo_filamento_g: '0.115',
  tempo_h: '',
  tempo_m: '',
  margem: '100',
  preco_vendido: '',
  link_projeto: '',
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

function Cor({ hex }) {
  return <span className="mw-cor" style={{ background: hex || '#ccc' }} title={hex} />
}

function camposDoPerfil(modelo, perfil, atual) {
  const t = Math.round(perfil.horas * 60)
  return {
    ...atual,
    produto: atual.produto && atual.link_projeto === modelo.url ? atual.produto : modelo.titulo,
    filamento: String(perfil.gramas),
    tempo_h: String(Math.floor(t / 60)),
    tempo_m: String(t % 60),
    link_projeto: modelo.url,
  }
}

export default function Simulador({ cfg, onAdicionar }) {
  const [s, setS] = useState(INITIAL)
  const [link, setLink] = useState('')
  const [modelo, setModelo] = useState(null)
  const [perfilId, setPerfilId] = useState(null)
  const [busca, setBusca] = useState({ estado: 'ocioso', msg: '' }) // ocioso | buscando | erro
  const [colar, setColar] = useState('')

  const set = (k) => (e) => setS((prev) => ({ ...prev, [k]: e.target.value }))

  function aplicar(json, alvo) {
    const m = parseDesign(json, alvo.instanceId)
    const perfil = (alvo.instanceId && m.perfis.find((p) => p.id === alvo.instanceId)) || melhorPerfilA1Mini(m) || m.perfis.find((p) => p.id === m.perfilId)
    setModelo(m)
    setPerfilId(perfil.id)
    setS((prev) => camposDoPerfil(m, perfil, prev))
    setBusca({ estado: 'ocioso', msg: '' })
    setColar('')
  }

  async function buscar(e) {
    e?.preventDefault()
    const alvo = parseLink(link)
    if (!alvo) { setBusca({ estado: 'erro', msg: 'Cole um link de modelo do MakerWorld (makerworld.com/.../models/123...).' }); return }
    setBusca({ estado: 'buscando', msg: '' })
    const { data, error } = await supabase.functions.invoke('makerworld', { body: { designId: alvo.designId } })
    if (error || !data || data.error) {
      setBusca({ estado: 'erro', msg: 'Não consegui buscar pelo servidor (a função "makerworld" do Supabase está publicada?). Use a opção de colar os dados abaixo.' })
      return
    }
    try { aplicar(data, alvo) } catch (err) { setBusca({ estado: 'erro', msg: err.message }) }
  }

  function usarColado() {
    const alvo = parseLink(link) || { instanceId: null }
    try { aplicar(JSON.parse(colar), alvo) } catch { setBusca({ estado: 'erro', msg: 'O texto colado não é o JSON do MakerWorld.' }) }
  }

  function escolherPerfil(id) {
    const p = modelo.perfis.find((x) => x.id === id)
    setPerfilId(id)
    setS((prev) => camposDoPerfil(modelo, p, prev))
  }

  function limpar() {
    setS(INITIAL); setModelo(null); setPerfilId(null); setLink(''); setColar(''); setBusca({ estado: 'ocioso', msg: '' })
  }

  const perfil = modelo?.perfis.find((p) => p.id === perfilId)
  const alvo = parseLink(link)

  // Cálculo
  const hs = horas(s.tempo_h, s.tempo_m)
  const custo = custoProducao({ gramas: num(s.filamento), custoG: num(s.custo_filamento_g, cfg.custoFilamentoG), horas: hs }, cfg)
  const margem = num(s.margem, 100)
  const precoVendido = num(s.preco_vendido)
  const hasResult = num(s.filamento) > 0 || hs > 0
  const canais = Object.keys(CANAIS).map((k) => ({
    k,
    label: CANAIS[k].label,
    minimo: precoParaLucro(0, custo, k, cfg),
  }))
  const sugerido = precoSugerido(custo, margem)
  for (const c of canais) c.vSug = venda(sugerido, custo, c.k, cfg)
  const sug = canais.find((c) => c.k === cfg.canal)
  const vSug = sugerido > 0 ? sug.vSug : null
  const vReal = precoVendido > 0 ? venda(precoVendido, custo, cfg.canal, cfg) : null
  const status = vReal ? statusMargem(vReal.margemVenda, true) : null

  const a1mini = perfil ? perfil.impressoras.some((x) => /a1 ?mini/i.test(x)) : null

  return (
    <div className="sim-wrap">
      <div className="sim-card">
        <div className="sim-card-header">
          <h2 className="sim-title">Simulador de Preço</h2>
          <p className="sim-desc">Cole um link do MakerWorld para puxar peso, tempo e licença, ou preencha à mão.</p>
        </div>

        <form className="mw-busca" onSubmit={buscar}>
          <input
            className="sim-input"
            type="url"
            placeholder="https://makerworld.com/pt/models/..."
            value={link}
            onChange={(e) => setLink(e.target.value)}
          />
          <button className="mw-btn" type="submit" disabled={busca.estado === 'buscando'}>
            {busca.estado === 'buscando' ? 'Buscando...' : 'Analisar link'}
          </button>
        </form>

        {busca.estado === 'erro' && (
          <div className="mw-erro">
            <p>{busca.msg}</p>
            {alvo && (
              <div className="mw-colar">
                <p>
                  Plano B: abra <a href={apiUrl(alvo.designId)} target="_blank" rel="noreferrer">os dados do modelo</a>,
                  selecione tudo (Ctrl+A), copie e cole aqui:
                </p>
                <textarea className="sim-input" rows={3} value={colar} onChange={(e) => setColar(e.target.value)} placeholder='{"id": ...}' />
                <button className="mw-btn" type="button" onClick={usarColado} disabled={!colar.trim()}>Usar dados colados</button>
              </div>
            )}
          </div>
        )}

        {modelo && (
          <div className="mw-modelo">
            {modelo.capa && <img className="mw-capa" src={modelo.capa} alt="" />}
            <div className="mw-info">
              <a className="mw-titulo" href={modelo.url} target="_blank" rel="noreferrer">{modelo.titulo}</a>
              <div className="mw-meta">
                por {modelo.autor} · {modelo.stats.impressoes.toLocaleString('pt-BR')} impressões · {modelo.stats.downloads.toLocaleString('pt-BR')} downloads
              </div>

              <div className={`mw-licenca ${modelo.venda.pode === false ? 'mw-licenca-nao' : modelo.venda.pode ? 'mw-licenca-ok' : ''}`}>
                <strong>{modelo.venda.pode === false ? 'Não pode vender' : modelo.venda.pode ? 'Venda permitida' : 'Confira a licença'}</strong>
                <span>{modelo.venda.motivo}</span>
                <span className="mw-licenca-obs">Personagens e marcas (filmes, desenhos, times) também exigem licença do dono dos direitos, seja qual for a licença do arquivo.</span>
              </div>

              <Field label="Perfil de impressão">
                <select className="sim-input" value={perfilId || ''} onChange={(e) => escolherPerfil(e.target.value)}>
                  {modelo.perfis.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.titulo} · {fmt(p.gramas, 0)} g · {fmtHoras(p.horas)}{p.precisaAms ? ' · AMS' : ''}
                    </option>
                  ))}
                </select>
              </Field>

              {perfil && (
                <div className="mw-perfil">
                  <div className="mw-tags">
                    <span className={`mw-tag ${a1mini ? 'mw-tag-ok' : 'mw-tag-alerta'}`}>
                      {a1mini ? 'Compatível com A1 Mini' : `Feito para ${perfil.impressoraPrincipal || 'outra impressora'}: confira se cabe na A1 Mini (18 cm)`}
                    </span>
                    <span className={`mw-tag ${perfil.precisaAms ? 'mw-tag-alerta' : 'mw-tag-ok'}`}>
                      {perfil.precisaAms ? 'Precisa de AMS (troca automática de cor)' : 'Não precisa de AMS'}
                    </span>
                    <span className="mw-tag">
                      {perfil.cores} {perfil.cores === 1 ? 'cor' : 'cores'}: {perfil.filamentos.map((f, i) => <Cor key={i} hex={f.cor} />)}
                    </span>
                  </div>
                  {perfil.placas.length > 0 && (
                    <table className="mw-placas">
                      <tbody>
                        {perfil.placas.map((p, i) => (
                          <tr key={i}>
                            <td>{p.nome}</td>
                            <td>{p.filamentos.map((f, j) => <Cor key={j} hex={f.cor} />)}</td>
                            <td>{fmt(p.gramas, 0)} g</td>
                            <td>{fmtHoras(p.horas)}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  )}
                </div>
              )}
            </div>
          </div>
        )}

        <div className="sim-body">
          <div className="sim-inputs">
            <Field label="Nome do produto">
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
              <Field label="Lucro desejado" hint="Em % do custo, depois das taxas">
                <div className="sim-prefix">
                  <input className="sim-input" type="number" min="0" step="1" placeholder="100" value={s.margem} onChange={set('margem')} />
                  <span>%</span>
                </div>
              </Field>
            </div>

            <Field label="Preço que pretende vender" hint="Deixe vazio para ver só o sugerido">
              <div className="sim-prefix">
                <span>R$</span>
                <input className="sim-input" type="number" min="0" step="0.01" placeholder="0,00" value={s.preco_vendido} onChange={set('preco_vendido')} />
              </div>
            </Field>

            <div className="sim-acoes">
              <button className="sim-reset" type="button" onClick={limpar}>Limpar</button>
              {hasResult && (
                <button
                  className="mw-btn"
                  type="button"
                  onClick={() => onAdicionar({
                    produto: s.produto, filamento: s.filamento, custo_filamento_g: s.custo_filamento_g,
                    tempo_h: s.tempo_h, tempo_m: s.tempo_m, margem: s.margem,
                    preco_vendido: s.preco_vendido || (sugerido > 0 ? sugerido.toFixed(2) : ''),
                    link_projeto: s.link_projeto,
                  })}
                >
                  Adicionar aos produtos
                </button>
              )}
            </div>
          </div>

          {hasResult && (
            <div className="sim-results">
              <div className="sim-result-title">Resultado ({CANAIS[cfg.canal].label})</div>

              <div className="sim-result-row">
                <span>Custo de produção</span>
                <strong>R$ {fmt(custo)}</strong>
              </div>
              <div className="sim-result-row">
                <span>Preço mínimo (lucro zero)</span>
                <strong>R$ {fmt(sug?.minimo ?? NaN)}</strong>
              </div>
              <div className="sim-result-row sim-result-highlight">
                <span>Preço sugerido (custo + {fmt(margem, 0)}%)</span>
                <strong className="sim-suggested">R$ {fmt(sugerido)}</strong>
              </div>
              {vSug && (
                <div className="sim-hint">
                  Vendendo por esse preço na {CANAIS[cfg.canal].label}: taxas R$ {fmt(vSug.taxas)} ({vSug.faixa}), sobra de lucro R$ {fmt(vSug.lucro)} ({fmt(vSug.margemVenda)}% da venda).
                </div>
              )}

              <div className="sim-divider" />
              <table className="mw-canais">
                <thead><tr><th>Canal</th><th>Mínimo</th><th>Lucro no sugerido</th></tr></thead>
                <tbody>
                  {canais.map((c) => (
                    <tr key={c.k} className={c.k === cfg.canal ? 'mw-canal-ativo' : ''}>
                      <td>{c.label}</td>
                      <td>R$ {fmt(c.minimo ?? NaN)}</td>
                      <td style={{ color: c.vSug.lucro >= 0 ? undefined : '#c0392b' }}>R$ {fmt(c.vSug.lucro)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>

              {vReal && (
                <>
                  <div className="sim-divider" />
                  <div className="sim-result-row">
                    <span>Taxas no seu preço</span>
                    <strong>R$ {fmt(vReal.taxas)}</strong>
                  </div>
                  <div className="sim-result-row">
                    <span>Lucro</span>
                    <strong style={{ color: vReal.lucro >= 0 ? '#2e7d52' : '#c0392b' }}>R$ {fmt(vReal.lucro)}</strong>
                  </div>
                  <div className="sim-result-row">
                    <span>Lucro sobre o custo</span>
                    <strong>{fmt(vReal.margemCusto)}%</strong>
                  </div>
                  <div className="sim-result-row">
                    <span>Lucro sobre a venda</span>
                    <strong>{fmt(vReal.margemVenda)}%</strong>
                  </div>
                  {status && (
                    <div className="sim-status" style={{ background: STATUS_COLORS[status] + '18', borderColor: STATUS_COLORS[status] + '44' }}>
                      <span className="sim-status-dot" style={{ background: STATUS_COLORS[status] }} />
                      <span style={{ color: STATUS_COLORS[status], fontWeight: 700 }}>{STATUS_LABELS[status]}</span>
                      <span className="sim-status-desc">— {STATUS_DESC[status]}.</span>
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
