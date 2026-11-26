import test from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { parseLink, parseDesign, licencaVenda, melhorPerfilA1Mini } from '../src/utils/makerworld.js'

const json = JSON.parse(readFileSync(new URL('./fixtures/makerworld-1891706.json', import.meta.url), 'utf8'))

test('parseLink: id do modelo e do perfil', () => {
  assert.deepEqual(
    parseLink('https://makerworld.com/pt/models/1891706-the-grinch-wall-mount?from=search#profileId-2179764'),
    { designId: '1891706', instanceId: '2179764' },
  )
  assert.deepEqual(parseLink('https://makerworld.com/en/models/123'), { designId: '123', instanceId: null })
  assert.equal(parseLink('https://evil.com/models/123'), null)
  assert.equal(parseLink('https://makerworld.com.evil.com/models/123'), null)
  assert.equal(parseLink('texto qualquer'), null)
})

test('parseDesign: perfil do link, com peso, tempo, placas e cores', () => {
  const m = parseDesign(json, '2179764')
  assert.equal(m.perfilId, '2179764')
  const p = m.perfis.find((x) => x.id === '2179764')
  assert.equal(p.gramas, 311)
  assert.ok(Math.abs(p.horas - 33144 / 3600) < 1e-9)
  assert.equal(p.precisaAms, false)
  assert.equal(p.placas.length, 3)
  assert.equal(p.filamentos.length, 3)
  assert.ok(p.impressoras.some((x) => /a1 mini/i.test(x)))
})

test('parseDesign: sem perfil no link, usa o padrão do modelo', () => {
  assert.equal(parseDesign(json).perfilId, String(json.defaultInstanceId))
})

test('melhorPerfilA1Mini: prefere A1 Mini sem AMS', () => {
  assert.equal(melhorPerfilA1Mini(parseDesign(json)).id, '2179764')
})

test('licença: Standard Digital File e NC bloqueiam venda', () => {
  assert.equal(parseDesign(json).venda.pode, false)
  assert.equal(licencaVenda('BY-NC-SA').pode, false)
  assert.equal(licencaVenda('BY').pode, true)
  assert.equal(licencaVenda('BY-SA').pode, true)
  assert.equal(licencaVenda('CC0').pode, true)
  assert.equal(licencaVenda('').pode, null)
})
