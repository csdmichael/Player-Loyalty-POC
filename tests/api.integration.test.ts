import assert from 'node:assert/strict'
import { describe, it } from 'node:test'
import request from 'supertest'
import { createApp } from '../api/app.js'

// Every test name is prefixed with a stable [TC-xx] identifier so a single test
// case can be selected from the ADO pipeline via `--test-name-pattern`.
// The mapping between test cases, requirements, and Azure DevOps work items is
// documented in the "Automated test cases" section of the README.

describe('Player Loyalty POC - automated test cases', () => {
  it('[TC-01] Health endpoint reports the service as healthy', async () => {
    const app = createApp()
    const response = await request(app).get('/health').expect(200)
    assert.equal(response.body.status, 'healthy')
  })

  it('[TC-02] Player profile returns the seeded balance and Gold tier', async () => {
    const app = createApp()
    const response = await request(app).get('/api/player').expect(200)
    assert.equal(response.body.balance, 12480)
    assert.equal(response.body.tier, 'Gold')
    assert.equal(response.body.nextTier, 'Platinum')
  })

  it('[TC-03] Recent activity ledger returns the seeded transactions', async () => {
    const app = createApp()
    const response = await request(app).get('/api/activity').expect(200)
    assert.equal(Array.isArray(response.body), true)
    assert.equal(response.body.length, 3)
    assert.equal(response.body[0].title, 'Slots at The Grand')
  })

  it('[TC-04] Offers catalog returns every seeded offer as not redeemed', async () => {
    const app = createApp()
    const response = await request(app).get('/api/offers').expect(200)
    assert.equal(response.body.length, 4)
    assert.equal(response.body.every((offer: { redeemed: boolean }) => offer.redeemed === false), true)
  })

  it('[TC-05] Redeeming an offer deducts points and returns a confirmation code', async () => {
    const app = createApp()
    const redemption = await request(app).post('/api/offers/1/redeem').expect(200)
    assert.equal(redemption.body.status, 'redeemed')
    assert.equal(redemption.body.balance, 9980)
    assert.equal(redemption.body.offer.redemptionCode, 'LW-1049')

    const player = await request(app).get('/api/player').expect(200)
    assert.equal(player.body.balance, 9980)
  })

  it('[TC-06] Redemption is idempotent and a second redeem returns 409', async () => {
    const app = createApp()
    await request(app).post('/api/offers/1/redeem').expect(200)
    const conflict = await request(app).post('/api/offers/1/redeem').expect(409)
    assert.equal(conflict.body.error, 'Offer already redeemed.')
  })

  it('[TC-07] Redeeming a zero-cost offer does not change the redeemed-offer metric', async () => {
    const app = createApp()
    const before = await request(app).get('/api/player').expect(200)
    await request(app).post('/api/offers/3/redeem').expect(200)
    const after = await request(app).get('/api/player').expect(200)
    assert.equal(after.body.balance, before.body.balance)
    assert.equal(after.body.metrics.redeemedOffers, before.body.metrics.redeemedOffers)
  })

  it('[TC-08] Insufficient points blocks redemption with a 409', async () => {
    const app = createApp()
    await request(app).post('/api/offers/1/redeem').expect(200)
    const conflict = await request(app).post('/api/offers/2/redeem').expect(409)
    assert.equal(conflict.body.error, 'Insufficient points.')
  })

  it('[TC-09] Unknown offer ids return 404 and non-integer ids return 400', async () => {
    const app = createApp()
    const notFound = await request(app).post('/api/offers/999/redeem').expect(404)
    assert.equal(notFound.body.error, 'Offer not found.')
    const badRequest = await request(app).post('/api/offers/abc/redeem').expect(400)
    assert.equal(badRequest.body.error, 'Offer id must be an integer.')
  })

  it('[TC-10] Notification preferences persist a complete payload', async () => {
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
  })

  it('[TC-11] Notification preferences reject partial or invalid payloads', async () => {
    const app = createApp()
    const response = await request(app).put('/api/preferences').send({ push: true }).expect(400)
    assert.equal(response.body.error, 'All preference values must be provided as booleans.')
  })

  it('[TC-12] CORS allows only the approved frontend origins', async () => {
    const app = createApp()
    for (const origin of ['http://localhost:5173', 'http://127.0.0.1:5173']) {
      const response = await request(app).get('/api/offers').set('Origin', origin).expect(200)
      assert.equal(response.headers['access-control-allow-origin'], origin)
    }
  })

  // Regression test for BUG 52 (Age/KYC verification bypass): a caller that is
  // underage or has an unverified KYC status must be blocked from redeeming.
  it('[TC-13] Age/KYC verification blocks underage or unverified redemption', async () => {
    const app = createApp()
    const response = await request(app)
      .post('/api/offers/1/redeem')
      .send({ ageVerified: false, kycStatus: 'unverified' })
      .expect(403)
    assert.equal(response.body.error, 'Age verification required to redeem.')
  })

  // Regression test for BUG 53 (offer-level gating): an age-restricted offer that
  // requires an entitlement must be denied when the caller lacks that entitlement.
  it('[TC-14] Offer-level gating enforces age-restricted content and entitlements', async () => {
    const app = createApp()
    const response = await request(app)
      .post('/api/offers/4/redeem')
      .send({ ageVerified: true, kycStatus: 'verified', entitlements: [] })
      .expect(403)
    assert.equal(response.body.error, 'Required entitlement missing for this offer.')
  })
})
