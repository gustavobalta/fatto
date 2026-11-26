// Motor de preço puro (sem React, sem DOM). Testado em pricing.test.js com `node --test`.
// Tarifas da Shopee copiadas do Venda com Lucro (tabela CNPJ divulgada em outubro/2026).

export const CANAIS = {
  shopee: {
    label: 'Shopee',
    fonte: 'Shopee CNPJ, tabela de out/2026',
    faixas: [
      { ate: 8.99, taxa: 20, fixo: 0, fixoPctPreco: 50 },
      { ate: 79.99, taxa: 20, fixo: 4.5 },
      { ate: 99.99, taxa: 14, fixo: 16 },
      { ate: 199.99, taxa: 14, fixo: 20 },
      { ate: null, taxa: 14, fixo: 26 },
    ],
  },
  ml: { label: 'Mercado Livre', fonte: 'comissão e tarifa informadas nas configurações', configuravel: true },
  direto: { label: 'Venda direta', fonte: 'sem tarifa de plataforma', faixas: [{ ate: null, taxa: 0, fixo: 0 }] },
}

export const CONFIG_PADRAO = {
  maquinaHora: 0.8,      // R$/h de impressora (energia + desgaste)
  falhaPct: 5,           // % de impressões perdidas (refeitas)
  embalagem: 1.5,        // R$ por pedido
  impostoPct: 0,         // % sobre a venda (MEI paga DAS fixo: 0)
  canal: 'shopee',
  mlTaxa: 12,            // % (Clássico ~12, Premium ~17; varia por categoria)
  mlFixo: 6.25,          // R$ por item abaixo de R$ 79
  mlFixoAte: 79,
  custoFilamentoG: 0.115,
}

// Converte texto do input em número. Vazio ou inválido devolve `padrao`; zero continua zero.
export function num(v, padrao = 0) {
  if (v === '' || v === null || v === undefined) return padrao
  const n = typeof v === 'number' ? v : parseFloat(String(v).replace(',', '.'))
  return Number.isFinite(n) ? n : padrao
}

const pos = (x) => (Number.isFinite(x) && x > 0 ? x : 0)

export function horas(h, m) {
  return pos(num(h)) + pos(num(m)) / 60
}

// Custo de produzir uma unidade (filamento + máquina), já com a perda por falha.
export function custoProducao({ gramas, custoG, horas: hs }, cfg = CONFIG_PADRAO) {
  const base = pos(gramas) * pos(custoG) + pos(hs) * pos(cfg.maquinaHora)
  return base * (1 + pos(cfg.falhaPct) / 100)
}

export function tarifa(preco, canal, cfg = CONFIG_PADRAO) {
  const c = CANAIS[canal] || CANAIS.shopee
  if (c.configuravel) {
    const fixo = preco < pos(cfg.mlFixoAte) ? pos(cfg.mlFixo) : 0
    return { taxa: pos(cfg.mlTaxa) / 100, fixo, faixa: `${c.label}: ${pos(cfg.mlTaxa)}%` + (fixo ? ` + R$ ${fixo.toFixed(2)}` : '') }
  }
  let de = 0
  for (const f of c.faixas) {
    if (f.ate === null || preco <= f.ate + 1e-9) {
      const fixo = f.fixoPctPreco ? (preco * f.fixoPctPreco) / 100 : f.fixo
      return { taxa: f.taxa / 100, fixo, faixa: rotuloFaixa(c.label, de, f.ate) }
    }
    de = f.ate + 0.01
  }
}

function rotuloFaixa(label, de, ate) {
  const r = (x) => 'R$ ' + x.toFixed(2).replace('.', ',')
  if (ate === null) return de > 0 ? `${label}: a partir de ${r(de)}` : label
  return de > 0 ? `${label}: ${r(de)} a ${r(ate)}` : `${label}: até ${r(ate)}`
}

// Quebra completa de uma venda de uma unidade.
export function venda(preco, custo, canal, cfg = CONFIG_PADRAO) {
  const p = pos(preco)
  const t = tarifa(p, canal, cfg)
  const comissao = p * t.taxa
  const imposto = (p * pos(cfg.impostoPct)) / 100
  const embalagem = pos(cfg.embalagem)
  const lucro = p - comissao - t.fixo - imposto - embalagem - custo
  return {
    preco: p, custo, comissao, fixo: t.fixo, imposto, embalagem, lucro, faixa: t.faixa,
    taxas: comissao + t.fixo + imposto + embalagem,
    margemVenda: p > 0 ? (lucro / p) * 100 : 0,
    margemCusto: custo > 0 ? (lucro / custo) * 100 : 0,
  }
}

// Menor preço (em centavos) cujo lucro atinge `lucroAlvo`. A tarifa salta nas bordas das faixas,
// então resolve por bisseção dentro de cada faixa e fica com o menor preço válido.
export function precoParaLucro(lucroAlvo, custo, canal, cfg = CONFIG_PADRAO) {
  const lucroEm = (cent) => venda(cent / 100, custo, canal, cfg).lucro
  for (const [lo, hi] of intervalos(canal, cfg)) {
    if (lucroEm(hi) < lucroAlvo - 1e-9) continue
    if (lucroEm(lo) >= lucroAlvo - 1e-9) return lo / 100
    let a = lo, b = hi
    while (b - a > 1) {
      const m = Math.floor((a + b) / 2)
      if (lucroEm(m) >= lucroAlvo - 1e-9) b = m
      else a = m
    }
    return b / 100
  }
  return null // inalcançável (taxas acima de 100%)
}

function intervalos(canal, cfg) {
  const MAX = 10000000 // R$ 100.000
  const c = CANAIS[canal] || CANAIS.shopee
  if (c.configuravel) {
    const borda = Math.round(pos(cfg.mlFixoAte) * 100)
    return borda > 1 ? [[1, borda - 1], [borda, MAX]] : [[1, MAX]]
  }
  const out = []
  let lo = 1
  for (const f of c.faixas) {
    const hi = f.ate === null ? MAX : Math.round(f.ate * 100)
    if (hi >= lo) out.push([lo, hi])
    lo = hi + 1
  }
  return out
}

// Margem desejada = lucro como % do custo (mesmo significado que o app já usava).
export function precoSugerido(custo, margemPct, canal, cfg = CONFIG_PADRAO) {
  return precoParaLucro((custo * pos(margemPct)) / 100, custo, canal, cfg)
}

export function statusMargem(margemVenda, temPreco) {
  if (!temPreco) return null
  if (margemVenda >= 40) return 'excelente'
  if (margemVenda >= 25) return 'saudavel'
  if (margemVenda >= 10) return 'atencao'
  return 'critico'
}

export const STATUS_LABELS = { excelente: 'Excelente', saudavel: 'Saudável', atencao: 'Atenção', critico: 'Crítico' }
export const STATUS_COLORS = { excelente: '#4caf7d', saudavel: '#f5a623', atencao: '#e08c2a', critico: '#e05555' }
export const STATUS_DESC = {
  excelente: 'lucro acima de 40% da venda, depois das taxas',
  saudavel: 'lucro entre 25% e 40% da venda',
  atencao: 'lucro entre 10% e 25% da venda: pouco espaço para cupom e ADS',
  critico: 'lucro abaixo de 10% da venda: reveja preço ou custo',
}

export function fmt(v, casas = 2) {
  if (!Number.isFinite(v)) return '—'
  return v.toFixed(casas).replace('.', ',')
}

export function fmtHoras(h) {
  const t = Math.round(pos(h) * 60)
  return `${Math.floor(t / 60)}h${String(t % 60).padStart(2, '0')}`
}

// Cálculo de uma linha da tabela de produtos.
export function calcLinha(row, cfg = CONFIG_PADRAO) {
  const custo = custoProducao({ gramas: num(row.filamento), custoG: num(row.custo_filamento_g, cfg.custoFilamentoG), horas: horas(row.tempo_h, row.tempo_m) }, cfg)
  const sugerido = precoSugerido(custo, num(row.margem, 100), cfg.canal, cfg)
  const precoVendido = num(row.preco_vendido)
  const v = venda(precoVendido, custo, cfg.canal, cfg)
  return {
    custo,
    preco_sugerido: sugerido,
    lucro: precoVendido > 0 ? v.lucro : null,
    taxas: precoVendido > 0 ? v.taxas : null,
    margem_custo_final: precoVendido > 0 ? v.margemCusto : null,
    margem_venda_final: precoVendido > 0 ? v.margemVenda : null,
    status: statusMargem(v.margemVenda, precoVendido > 0),
  }
}
