# Player Loyalty App Service Deployment Plan

Status: Deployed and validated

## Scope

Convert the existing frontend-only POC into a deployed two-service application:

- React/Vite frontend hosted by a Node.js server on Azure App Service.
- Express REST API hosted on a second Azure App Service.
- Both apps share one Linux App Service Plan.
- API data remains hard-coded JSON under a source-controlled `config/` folder; no database is provisioned.
- Swagger UI and an OpenAPI document describe the API.

## Application Changes

1. Move player, activity, offer, and notification-preference seed data into `config/loyalty-data.json`.
2. Add a typed Express API with health, player summary, activity, offers, redemption, and preference endpoints.
3. Add Swagger UI and expose the OpenAPI JSON document.
4. Replace frontend constants with an API client configured by `VITE_API_URL`.
5. Add loading, error, and mutation states while preserving the current responsive UX.
6. Add a production frontend server that serves `dist/` and supports SPA fallback.
7. Add focused API and frontend integration tests.

## Azure Architecture

- Subscription: `ME-MngEnvMCAP829495-myaacoub-1` (`86b37969-9445-49cf-b03f-d8866235171c`).
- Existing resource group: `ai-myaacoub`.
- Region: West US 2, matching the resource group's general-purpose web workloads.
- Existing Linux Basic B2 App Service Plan: `plan-taxforms` (scaled from B1 with user approval before deployment).
- One Node.js 22 API web app.
- One Node.js 22 frontend web app on the same plan.
- HTTPS-only, minimum TLS 1.2, FTPS disabled, health checks enabled.
- Frontend app setting points to the API URL; API CORS permits only the deployed frontend URL.
- Bicep defines the resources and configuration reproducibly.

### Existing Plan Assessment

Existing Linux plans in `ai-myaacoub` were evaluated before proposing a new plan:

| Plan | 24-hour average memory | 24-hour peak memory | Decision |
| --- | ---: | ---: | --- |
| `plan-taxforms` | 80.50% | 82% | Approved for reuse by the user; monitor closely during deployed validation. |
| `plan-fabriciq-b3` | 79.62% | 82% | Do not reuse; 7 sites and high sustained memory. |
| `asp-fdryvnetgw-data-eastus` | 77.57% | 79% | Do not reuse; dedicated to two Foundry gateway Functions in East US. |

The user explicitly approved `plan-taxforms` to avoid creating another plan and subsequently approved scaling it from B1 to B2 after deployment pressure produced Kudu timeouts. Both apps now run on that shared B2 plan.

## Deployment

1. Validate application tests, lint, build, OpenAPI, and Bicep.
2. Provision the shared App Service Plan and both web apps.
3. Package and deploy the API and frontend separately.
4. Run deployed API health, Swagger, frontend, and browser integration checks.
5. Update the Azure DevOps pipeline for both App Service deployments.
6. Commit and publish source changes to GitHub and Azure Repos.

## Documentation

- Add a table of contents to `README.md`.
- Document local API/frontend development and testing.
- Add a Deployed Services section containing the API URL, Swagger URL, frontend URL, and Azure DevOps project URL.

## Validation Proof

Validated on 2026-08-02:

- `npm test`: 4 API tests passed, including local CORS, idempotent redemption, and preference persistence.
- `npm run lint`: passed with no Oxlint diagnostics.
- `npm run build`: API TypeScript compilation and Vite production build passed.
- `npm run package:deploy`: API and frontend App Service artifacts staged successfully.
- Bicep MCP build: `infra/main.bicep` and `infra/main.bicepparam` compiled with no diagnostics.
- Azure deployment validation: authenticated to `ME-MngEnvMCAP829495-myaacoub-1`; template validation passed against `ai-myaacoub`.
- Azure what-if: create-only result; 0 modifications and 0 deletions.
- Azure Policy: no assignments found at or above the `ai-myaacoub` scope.
- Static RBAC review: no application managed identities or data-plane role assignments are required because the API uses source-controlled JSON only.
- Local browser integration: API-backed dashboard loaded; redemption remained single-use with balance persistence after navigation; saved SMS preference persisted after navigation.
- Azure provisioning: API and frontend apps were created on the existing `plan-taxforms` plan; explicit `node api-dist/server.js` and `node web-server.mjs` startup commands are active.
- Azure deployment: both bearer-authenticated OneDeploy operations completed with status 4 while SCM basic authentication remained disabled.
- Deployed smoke test: API health, Swagger/OpenAPI, deployed-origin CORS, frontend health, and SPA delivery passed.
- Public browser integration: registration opened the API-backed dashboard; a 2,500-point redemption changed the balance from 12,480 to 9,980 and persisted across navigation; the SMS preference persisted after save and navigation.
- Azure DevOps quality artifacts: existing Bugs 51-53 were verified and Test Cases 56-60 were created and linked to their owning Features.

## Required Approval

- Approved: subscription `ME-MngEnvMCAP829495-myaacoub-1`.
- Approved: resource group `ai-myaacoub`.
- Approved: West US 2 and existing App Service Plan `plan-taxforms`.
- App-name prefix: `player-loyalty-poc`.
- Approved: create two web apps in `ai-myaacoub`; do not create a new App Service Plan.