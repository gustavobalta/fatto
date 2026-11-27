// Analisa um modelo do MakerWorld fora do navegador (sem CORS) e mostra quanto cobrar.
// Uso: npm run mw -- "<link do MakerWorld>" [margem% = 100] [R$/kg = 115]
import { execFileSync } from 'node:child_process'
import { parseLink, apiUrl, parseDesign, melhorPerfilA1Mini } from '../src/utils/makerworld.js'
import { CANAIS, CONFIG_PADRAO, custoProducao, precoParaLucro, precoSugerido, venda, fmt, fmtHoras } from '../src/utils/pricing.js'

const [link, margemArg, kgArg] = process.argv.slice(2)
const alvo = parseLink(link)
if (!alvo) { console.error('Link inválido. Exemplo: https://makerworld.com/pt/models/1891706-...#profileId-2179764'); process.exit(1) }
const margem = Number(margemArg ?? 100)
const custoG = Number(kgArg ?? CONFIG_PADRAO.custoFilamentoG * 1000) / 1000

// fetch do Node leva 403 da proteção do MakerWorld; o curl passa.
const bruto = execFileSync('curl', ['-s', '-f', '-A', 'Mozilla/5.0', apiUrl(alvo.designId)], { encoding: 'utf8', maxBuffer: 64 * 1024 * 1024 })
const m = parseDesign(JSON.parse(bruto), alvo.instanceId)

const perfil = (alvo.instanceId && m.perfis.find((p) => p.id === alvo.instanceId)) || melhorPerfilA1Mini(m) || m.perfis.find((p) => p.id === m.perfilId)
const R = (v) => (v == null ? '—' : 'R$ ' + fmt(v))

console.log(`\n${m.titulo}  (por ${m.autor})\n${m.url}`)
console.log(`Licença: ${m.licenca || '?'} → ${m.venda.pode === false ? 'NÃO PODE VENDER' : m.venda.pode ? 'pode vender' : 'conferir'}. ${m.venda.motivo}`)
console.log(`\nPerfis (${m.perfis.length}):`)
for (const p of m.perfis) {
  const a1 = p.impressoras.some((x) => /a1 ?mini/i.test(x)) ? 'A1 Mini' : p.impressoraPrincipal
  console.log(`${p.id === perfil.id ? ' >' : '  '} ${p.id}  ${p.gramas} g  ${fmtHoras(p.horas)}  ${a1}${p.precisaAms ? '  AMS' : ''}  ${p.cores} cor(es)  ${p.placas.length} placa(s)  ${p.titulo}`)
}

const custo = custoProducao({ gramas: perfil.gramas, custoG, horas: perfil.horas })
console.log(`\nPerfil usado: ${perfil.id}  ${perfil.gramas} g, ${fmtHoras(perfil.horas)}${perfil.precisaAms ? ', precisa de AMS' : ''}`)
console.log(`Custo por peça: ${R(custo)}  (filamento R$ ${fmt(custoG * 1000)}/kg, energia ${CONFIG_PADRAO.potenciaW} W × R$ ${fmt(CONFIG_PADRAO.kwh)}/kWh)`)
console.log(`\nCanal            Mínimo (lucro 0)   Sugerido (custo + ${margem}%)         Lucro no sugerido`)
for (const canal of Object.keys(CANAIS)) {
  const min = precoParaLucro(0, custo, canal)
  const sug = precoSugerido(custo, margem)
  const v = sug != null ? venda(sug, custo, canal) : null
  console.log(`${CANAIS[canal].label.padEnd(16)} ${R(min).padEnd(18)} ${R(sug).padEnd(37)} ${v ? R(v.lucro) + ` (${fmt(v.margemVenda, 0)}% da venda)` : '—'}`)
}
console.log('')
