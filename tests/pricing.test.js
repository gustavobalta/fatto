import test from 'node:test'
import assert from 'node:assert/strict'
import { CONFIG_PADRAO, num, custoProducao, tarifa, venda, precoParaLucro, precoSugerido, calcLinha, fmtHoras } from '../src/utils/pricing.js'

const cfg = { ...CONFIG_PADRAO, maquinaHora: 0.8, falhaPct: 0, embalagem: 0, impostoPct: 0 }
const quase = (a, b, tol = 0.011) => assert.ok(Math.abs(a - b) <= tol, `${a} ≠ ${b}`)

test('num: vazio vira padrão, zero continua zero', () => {
  assert.equal(num('', 100), 100)
  assert.equal(num('0', 100), 0)
  assert.equal(num('1,5'), 1.5)
  assert.equal(num('abc', 7), 7)
})

test('custo: filamento + máquina, com perda por falha', () => {
  quase(custoProducao({ gramas: 100, custoG: 0.115, horas: 2 }, cfg), 11.5 + 1.6)
  quase(custoProducao({ gramas: 100, custoG: 0.115, horas: 2 }, { ...cfg, falhaPct: 10 }), (11.5 + 1.6) * 1.1)
})

test('Shopee: faixas de out/2026', () => {
  assert.deepEqual([tarifa(50, 'shopee', cfg).taxa, tarifa(50, 'shopee', cfg).fixo], [0.2, 4.5])
  assert.deepEqual([tarifa(79.99, 'shopee', cfg).taxa, tarifa(79.99, 'shopee', cfg).fixo], [0.2, 4.5])
  assert.deepEqual([tarifa(80, 'shopee', cfg).taxa, tarifa(80, 'shopee', cfg).fixo], [0.14, 16])
  assert.deepEqual([tarifa(250, 'shopee', cfg).taxa, tarifa(250, 'shopee', cfg).fixo], [0.14, 26])
  quase(tarifa(8, 'shopee', cfg).fixo, 4) // abaixo de R$ 8,99 a tarifa fixa é metade do preço
})

test('ML: comissão configurável e tarifa fixa abaixo de R$ 79', () => {
  const ml = { ...cfg, mlTaxa: 12, mlFixo: 6.25, mlFixoAte: 79 }
  assert.equal(tarifa(50, 'ml', ml).fixo, 6.25)
  assert.equal(tarifa(79, 'ml', ml).fixo, 0)
})

test('venda: lucro desconta comissão, tarifa, embalagem e imposto', () => {
  const v = venda(50, 10, 'shopee', { ...cfg, embalagem: 1, impostoPct: 6 })
  quase(v.lucro, 50 - 10 - 4.5 - 3 - 1 - 10)
})

test('precoParaLucro: menor preço que atinge o lucro, respeitando saltos de faixa', () => {
  const custo = 20
  const p = precoParaLucro(20, custo, 'shopee', cfg)
  assert.ok(venda(p, custo, 'shopee', cfg).lucro >= 20 - 1e-9)
  assert.ok(venda(p - 0.01, custo, 'shopee', cfg).lucro < 20)
  // Lucro de 55 não cabe até R$ 79,99 (máximo 49,49); na faixa seguinte o fixo é 16: 55 = 0,86p - 26 → p = 94,19
  const alto = precoParaLucro(55, 10, 'shopee', cfg)
  quase(alto, 94.19)
  assert.ok(venda(alto, 10, 'shopee', cfg).lucro >= 55 - 1e-9)
})

test('precoSugerido: margem é lucro em % do custo', () => {
  const custo = 10
  const p = precoSugerido(custo, 100, 'direto', cfg)
  quase(p, 20)
})

test('calcLinha: sem preço vendido não inventa lucro', () => {
  const c = calcLinha({ filamento: '100', custo_filamento_g: '0.115', tempo_h: '1', tempo_m: '30', margem: '100', preco_vendido: '' }, cfg)
  assert.equal(c.lucro, null)
  assert.equal(c.status, null)
  assert.ok(c.preco_sugerido > c.custo * 2)
})

test('calcLinha: margem 0 e R$/g 0 são respeitados', () => {
  const c = calcLinha({ filamento: '100', custo_filamento_g: '0', tempo_h: '0', tempo_m: '0', margem: '0', preco_vendido: '' }, { ...cfg, canal: 'direto' })
  assert.equal(c.custo, 0)
  assert.equal(c.preco_sugerido, 0.01)
})

test('fmtHoras', () => {
  assert.equal(fmtHoras(9.2067), '9h12')
  assert.equal(fmtHoras(0.5), '0h30')
})
