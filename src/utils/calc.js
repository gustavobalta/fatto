export function calcRow(row, filamentoCusto, electricidade) {
  const g = parseFloat(row.filamento) || 0
  const h = (parseInt(row.tempo_h) || 0) + (parseInt(row.tempo_m) || 0) / 60
  const margem = (parseFloat(row.margem) || 0) / 100

  const custo = g * (parseFloat(filamentoCusto) || 0) + h * (parseFloat(electricidade) || 0)
  const preco_sugerido = custo * (1 + margem)
  const preco_vendido = parseFloat(row.preco_vendido) || 0
  const lucro = preco_vendido - custo
  const margem_custo_final = custo > 0 ? (lucro / custo) * 100 : 0
  const margem_venda_final = preco_vendido > 0 ? (lucro / preco_vendido) * 100 : 0

  let status = null
  if (preco_vendido > 0) {
    if (margem_venda_final >= 55) status = 'excelente'
    else if (margem_venda_final >= 40) status = 'saudavel'
    else if (margem_venda_final >= 20) status = 'atencao'
    else status = 'critico'
  }

  return { custo, preco_sugerido, lucro, margem_custo_final, margem_venda_final, status }
}

export const STATUS_LABELS = {
  excelente: 'Excelente',
  saudavel: 'Saudável',
  atencao: 'Atenção',
  critico: 'Crítico',
}

export const STATUS_COLORS = {
  excelente: '#4caf7d',
  saudavel: '#f5a623',
  atencao: '#e08c2a',
  critico: '#e05555',
}

export function fmt(v, decimals = 2) {
  return v.toFixed(decimals).replace('.', ',')
}
