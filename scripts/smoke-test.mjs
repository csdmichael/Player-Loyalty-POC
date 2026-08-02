import assert from 'node:assert/strict'

const apiUrl = (process.env.API_URL ?? '').replace(/\/$/, '')
const webUrl = (process.env.WEB_URL ?? '').replace(/\/$/, '')
if (!apiUrl || !webUrl) throw new Error('API_URL and WEB_URL are required.')

async function expectOk(url, options) {
  const response = await fetch(url, options)
  assert.equal(response.ok, true, `${url} returned ${response.status}`)
  return response
}

const apiHealth = await expectOk(`${apiUrl}/health`)
assert.equal((await apiHealth.json()).status, 'healthy')

const player = await expectOk(`${apiUrl}/api/player`)
assert.equal(typeof (await player.json()).balance, 'number')

const swagger = await expectOk(`${apiUrl}/swagger/`)
assert.match(await swagger.text(), /Swagger UI/)

const cors = await expectOk(`${apiUrl}/api/offers`, { headers: { Origin: webUrl } })
assert.equal(cors.headers.get('access-control-allow-origin'), webUrl)

const webHealth = await expectOk(`${webUrl}/health`)
assert.equal((await webHealth.json()).status, 'healthy')

const web = await expectOk(webUrl)
assert.match(await web.text(), /<div id="root"><\/div>/)
console.log('Deployed API, Swagger, CORS, frontend health, and SPA checks passed.')