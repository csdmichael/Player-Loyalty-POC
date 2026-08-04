import assert from 'node:assert/strict'
import { describe, it } from 'node:test'
import request from 'supertest'
import { createApp } from './app.js'

describe('L&W Rewards API', () => {
  it('redirects the deployed API root to the configured frontend', async () => {
    const previousFrontendOrigin = process.env.FRONTEND_ORIGIN
    process.env.FRONTEND_ORIGIN = 'https://player-loyalty.example'

    try {
      const response = await request(createApp()).get('/').expect(302)
      assert.equal(response.headers.location, 'https://player-loyalty.example')
    } finally {
      if (previousFrontendOrigin === undefined) delete process.env.FRONTEND_ORIGIN
      else process.env.FRONTEND_ORIGIN = previousFrontendOrigin
    }
  })

  it('serves health, player data, and Swagger metadata', async () => {
    const app = createApp()
    const health = await request(app).get('/health').expect(200)
    const player = await request(app).get('/api/player').expect(200)
    const openApi = await request(app).get('/openapi.json').expect(200)

    assert.equal(health.body.status, 'healthy')
    assert.equal(player.body.balance, 12480)
    assert.equal(openApi.body.info.title, 'L&W Rewards API')
  })

  it('allows the local Vite loopback origins', async () => {
    const app = createApp()
    for (const origin of ['http://localhost:5173', 'http://127.0.0.1:5173']) {
      const response = await request(app).get('/api/offers').set('Origin', origin).expect(200)
      assert.equal(response.headers['access-control-allow-origin'], origin)
    }
  })

  it('redeems an offer once and preserves the updated balance', async () => {
    const app = createApp()
    const redemption = await request(app).post('/api/offers/1/redeem').expect(200)
    const player = await request(app).get('/api/player').expect(200)
    const offers = await request(app).get('/api/offers').expect(200)

    assert.equal(redemption.body.balance, 9980)
    assert.equal(redemption.body.offer.redemptionCode, 'LW-1049')
    assert.equal(player.body.balance, 9980)
    assert.equal(offers.body[0].redeemed, true)
    await request(app).post('/api/offers/1/redeem').expect(409)
  })

  it('persists complete notification preferences and rejects partial payloads', async () => {
    const app = createApp()
    const preferences = {
      push: false,
      email: true,
      sms: true,
      offers: false,
      points: true,
      events: true,
      responsible: true,
      quiet: false,
    }

    await request(app).put('/api/preferences').send(preferences).expect(200)
    const saved = await request(app).get('/api/preferences').expect(200)
    assert.deepEqual(saved.body, preferences)
    await request(app).put('/api/preferences').send({ push: true }).expect(400)
  })
})