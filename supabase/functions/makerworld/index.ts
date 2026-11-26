// Busca os dados públicos de um modelo do MakerWorld para o fatto-lab.
// O navegador não consegue chamar a API do MakerWorld direto (sem CORS), então passa por aqui.
// A verificação de JWT do Supabase (padrão das Edge Functions) deixa só usuários logados chamarem.
//
// Deploy:  npx supabase functions deploy makerworld --project-ref tlvunnzgrawkolgrgucd

const ORIGENS = ['https://gustavobalta.github.io', 'http://localhost:5173', 'http://localhost:4173']

function cors(origin: string | null) {
  return {
    'Access-Control-Allow-Origin': origin && ORIGENS.includes(origin) ? origin : ORIGENS[0],
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    Vary: 'Origin',
  }
}

Deno.serve(async (req) => {
  const h = cors(req.headers.get('Origin'))
  if (req.method === 'OPTIONS') return new Response('ok', { headers: h })

  let designId = ''
  try {
    const body = await req.json()
    designId = String(body?.designId ?? '')
  } catch { /* corpo inválido */ }
  if (!/^\d{1,12}$/.test(designId)) {
    return Response.json({ error: 'designId inválido' }, { status: 400, headers: h })
  }

  const r = await fetch(`https://makerworld.com/api/v1/design-service/design/${designId}`, {
    headers: { 'User-Agent': 'Mozilla/5.0 (compatible; fatto-lab)', Accept: 'application/json' },
  })
  if (!r.ok) {
    return Response.json({ error: `MakerWorld respondeu ${r.status}` }, { status: 502, headers: h })
  }
  return new Response(await r.text(), { headers: { ...h, 'Content-Type': 'application/json' } })
})
