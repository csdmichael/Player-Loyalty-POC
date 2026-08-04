import cors from 'cors'
import express from 'express'
import swaggerUi from 'swagger-ui-express'
import { LoyaltyStore, type PreferenceKey, type Preferences, type RedeemContext } from './data-store.js'
import { openApiDocument } from './openapi.js'

const preferenceKeys: PreferenceKey[] = ['push', 'email', 'sms', 'offers', 'points', 'events', 'responsible', 'quiet']

function isPreferences(value: unknown): value is Preferences {
  if (!value || typeof value !== 'object') return false
  const record = value as Record<string, unknown>
  return preferenceKeys.every((key) => typeof record[key] === 'boolean') && Object.keys(record).length === preferenceKeys.length
}

function parseRedeemContext(body: unknown): RedeemContext {
  if (!body || typeof body !== 'object') return {}
  const record = body as Record<string, unknown>
  const context: RedeemContext = {}
  if (typeof record.ageVerified === 'boolean') context.ageVerified = record.ageVerified
  if (typeof record.kycStatus === 'string') context.kycStatus = record.kycStatus
  if (Array.isArray(record.entitlements)) {
    context.entitlements = record.entitlements.filter((value): value is string => typeof value === 'string')
  }
  return context
}

export function createApp(store = new LoyaltyStore()) {
  const app = express()
  const frontendOrigin = process.env.FRONTEND_ORIGIN
  const allowedOrigins = frontendOrigin
    ? [frontendOrigin]
    : ['http://localhost:5173', 'http://127.0.0.1:5173']
  app.disable('x-powered-by')
  app.use(cors({ origin: allowedOrigins }))
  app.use(express.json({ limit: '32kb' }))

  if (frontendOrigin) app.get('/', (_request, response) => response.redirect(frontendOrigin))
  app.get('/health', (_request, response) => response.json({ status: 'healthy' }))
  app.get('/api/player', (_request, response) => response.json(store.getPlayer()))
  app.get('/api/activity', (_request, response) => response.json(store.getActivity()))
  app.get('/api/offers', (_request, response) => response.json(store.getOffers()))
  app.post('/api/offers/:id/redeem', (request, response) => {
    const id = Number(request.params.id)
    if (!Number.isInteger(id)) return response.status(400).json({ error: 'Offer id must be an integer.' })

    const result = store.redeemOffer(id, parseRedeemContext(request.body))
    if (result.status === 'not-found') return response.status(404).json({ error: 'Offer not found.' })
    if (result.status === 'already-redeemed') return response.status(409).json({ error: 'Offer already redeemed.', offer: result.offer })
    if (result.status === 'age-verification-required') return response.status(403).json({ error: 'Age verification required to redeem.' })
    if (result.status === 'entitlement-required') return response.status(403).json({ error: 'Required entitlement missing for this offer.' })
    if (result.status === 'insufficient-points') return response.status(409).json({ error: 'Insufficient points.' })
    return response.json(result)
  })
  app.get('/api/preferences', (_request, response) => response.json(store.getPreferences()))
  app.put('/api/preferences', (request, response) => {
    if (!isPreferences(request.body)) return response.status(400).json({ error: 'All preference values must be provided as booleans.' })
    return response.json(store.updatePreferences(request.body))
  })

  app.get('/openapi.json', (_request, response) => response.json(openApiDocument))
  app.use('/swagger', swaggerUi.serve, swaggerUi.setup(openApiDocument))
  return app
}