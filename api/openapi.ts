export const openApiDocument = {
  openapi: '3.0.3',
  info: {
    title: 'L&W Rewards API',
    version: '1.0.0',
    description: 'Config-backed API for the Player Loyalty proof of concept.',
  },
  servers: [{ url: '/' }],
  paths: {
    '/health': { get: { summary: 'Service health', responses: { '200': { description: 'Healthy' } } } },
    '/api/player': { get: { summary: 'Player loyalty summary', responses: { '200': { description: 'Player summary' } } } },
    '/api/activity': { get: { summary: 'Recent points activity', responses: { '200': { description: 'Activity list' } } } },
    '/api/offers': { get: { summary: 'Available offers', responses: { '200': { description: 'Offer list' } } } },
    '/api/offers/{id}/redeem': {
      post: {
        summary: 'Redeem or activate an offer',
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'integer' } }],
        requestBody: {
          required: false,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  ageVerified: { type: 'boolean' },
                  kycStatus: { type: 'string' },
                  entitlements: { type: 'array', items: { type: 'string' } },
                },
              },
            },
          },
        },
        responses: {
          '200': { description: 'Offer redeemed' },
          '403': { description: 'Age/KYC verification or required entitlement missing' },
          '404': { description: 'Offer not found' },
          '409': { description: 'Offer already redeemed or points are insufficient' },
        },
      },
    },
    '/api/preferences': {
      get: { summary: 'Notification preferences', responses: { '200': { description: 'Current preferences' } } },
      put: {
        summary: 'Replace notification preferences',
        requestBody: { required: true, content: { 'application/json': { schema: { type: 'object', additionalProperties: { type: 'boolean' } } } } },
        responses: { '200': { description: 'Saved preferences' }, '400': { description: 'Invalid preferences' } },
      },
    },
  },
} as const