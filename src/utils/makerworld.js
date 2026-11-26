// Leitura de modelos do MakerWorld. Puro: recebe o JSON de
// https://makerworld.com/api/v1/design-service/design/<id> e devolve só o que o app usa.

export function parseLink(texto) {
  const s = String(texto || '').trim()
  let url
  try { url = new URL(s) } catch { return null }
  if (!/(^|\.)makerworld\.com$/i.test(url.hostname)) return null
  const m = url.pathname.match(/\/models\/(\d+)/)
  if (!m) return null
  const p = (url.hash + '&' + url.search).match(/profileId[-=](\d+)/i)
  return { designId: m[1], instanceId: p ? p[1] : null }
}

export function apiUrl(designId) {
  return `https://makerworld.com/api/v1/design-service/design/${designId}`
}

// Classifica a licença para venda de peças impressas.
export function licencaVenda(nome = '') {
  const n = nome.toUpperCase()
  if (!n) return { pode: null, motivo: 'Licença não informada: confira na página do modelo.' }
  if (n.includes('STANDARD DIGITAL FILE')) return { pode: false, motivo: 'Licença Standard Digital File: proíbe vender o arquivo e as peças impressas sem autorização do autor.' }
  if (/\bNC\b|NONCOMMERCIAL|NON-COMMERCIAL/.test(n)) return { pode: false, motivo: 'Creative Commons NC (não comercial): vender as peças não é permitido.' }
  if (/CC0|PUBLIC DOMAIN/.test(n)) return { pode: true, motivo: 'Domínio público (CC0): pode vender.' }
  if (/\bBY\b|CC BY|ATTRIBUTION/.test(n)) return { pode: true, motivo: 'Creative Commons com atribuição: pode vender, citando o autor no anúncio.' }
  return { pode: null, motivo: `Licença "${nome}": confira os termos antes de vender.` }
}

const limpa = (html = '') => html.replace(/<[^>]+>/g, ' ').replace(/&nbsp;/g, ' ').replace(/\s+/g, ' ').trim()

export function parseDesign(d, instanceIdPreferido = null) {
  if (!d || !Array.isArray(d.instances)) throw new Error('Resposta do MakerWorld sem perfis de impressão.')
  const perfis = d.instances.map((i) => {
    const info = i.extention?.modelInfo || {}
    const impressoras = [info.compatibility?.devProductName, ...(info.otherCompatibility || []).map((x) => x.devProductName)].filter(Boolean)
    const filamentos = (i.instanceFilaments || []).map((f) => ({ tipo: f.type, cor: f.color, gramas: parseFloat(f.usedG) || 0 }))
    return {
      id: String(i.id),
      titulo: i.title || `Perfil ${i.id}`,
      gramas: Number(i.weight) || filamentos.reduce((s, f) => s + f.gramas, 0),
      horas: (Number(i.prediction) || 0) / 3600,
      precisaAms: !!i.needAms,
      cores: i.materialColorCnt || filamentos.length || 1,
      impressoraPrincipal: info.compatibility?.devProductName || '',
      impressoras,
      placas: (info.plates || []).map((p) => ({
        nome: p.name || `Placa ${p.index}`,
        gramas: Number(p.weight) || 0,
        horas: (Number(p.prediction) || 0) / 3600,
        filamentos: (p.filaments || []).map((f) => ({ tipo: f.type, cor: f.color, gramas: parseFloat(f.usedG) || 0 })),
      })),
      filamentos,
      impressoes: i.printCount || 0,
      nota: i.ratingCount ? (i.ratingScoreTotal || 0) / i.ratingCount : null,
    }
  })
  const preferido = perfis.find((p) => p.id === String(instanceIdPreferido))
    || perfis.find((p) => p.id === String(d.defaultInstanceId))
    || perfis[0]
  return {
    id: String(d.id),
    titulo: d.title,
    capa: d.coverUrl,
    autor: d.designCreator?.name || '',
    resumo: limpa(d.summary).slice(0, 400),
    tags: d.tags || [],
    licenca: d.license || '',
    licencaTexto: d.licenseDescriptionInfo?.content || '',
    venda: licencaVenda(d.license),
    stats: { downloads: d.downloadCount || 0, impressoes: d.printCount || 0, curtidas: d.likeCount || 0 },
    url: `https://makerworld.com/pt/models/${d.id}`,
    perfis,
    perfilId: preferido?.id || null,
  }
}

// Perfil indicado para a A1 Mini sem AMS (a impressora da FattoLab3D), quando o link não escolhe um.
export function melhorPerfilA1Mini(modelo) {
  const a1m = (p) => p.impressoras.some((x) => /a1 ?mini/i.test(x))
  return modelo.perfis.find((p) => a1m(p) && !p.precisaAms) || modelo.perfis.find(a1m) || null
}
