# L&W Rewards Player Loyalty

A responsive proof of concept for the L&W Rewards mobile experience. The application translates the supplied UX mockups and requirements into an interactive React client that runs on desktop and mobile browsers.

## Table of contents

- [Features](#features)
- [Architecture](#architecture)
- [Technology](#technology)
- [Local development](#local-development)
- [Quality checks](#quality-checks)
- [Azure deployment](#azure-deployment)
- [Deployed services](#deployed-services)
- [Requirement traceability](#requirement-traceability)
- [Accessibility and security notes](#accessibility-and-security-notes)

## Features

- **Registration and identity (SCR-01):** validated account form, 21+ age gate, consent, sign-in path, and Microsoft Entra ID trust cue.
- **Rewards dashboard (SCR-02):** live points balance, Gold-to-Platinum progress, member metrics, and recent activity ledger.
- **Offer management (SCR-03):** category filters, eligibility-aware redemption, point deduction, activation, and confirmation codes.
- **Notification preferences (SCR-04):** channel and category controls, quiet hours, responsible-gaming preference, and save confirmation.
- Responsive authenticated bottom navigation across Home, Rewards, Alerts, and Profile.

## Architecture

The React client calls a typed Express REST API. The API initializes its in-memory state from `config/loyalty-data.json`, so the POC needs no database while still demonstrating service-backed reads and mutations. Redemption is idempotent for the lifetime of the API process, and saved notification preferences remain available across frontend navigation.

Swagger UI and the OpenAPI document are exposed by the API. In Azure, the API and frontend run as separate Linux Node.js App Service apps on the existing `plan-taxforms` App Service Plan in `ai-myaacoub`.

## Technology

- React 19 and TypeScript
- Vite 8
- Express 5 REST API
- Swagger UI and OpenAPI 3
- Lucide React icons
- Oxlint
- Azure App Service deployment through GitHub Actions and Azure Pipelines

## Local development

Prerequisites: Node.js 22 or later and npm.

```bash
npm install
npm run dev:api
```

In a second terminal:

```bash
npm run dev
```

Open the URL printed by Vite. The frontend defaults to `http://localhost:3000` for API calls. Set `VITE_API_URL` before starting Vite to target another API.

## Quality checks

```bash
npm test
npm run lint
npm run build
npm run package:deploy
```

The frontend output is written to `dist/`, the compiled API to `api-dist/`, and minimal deployment packages to `.artifacts/`.

## Azure deployment

The application uses regular Azure App Service, not Azure Static Web Apps. Bicep in `infra/main.bicep` references the existing B2 `plan-taxforms` plan and creates only the two web apps. It also declares explicit Node.js startup commands and health checks for both services.

The GitHub workflows are:

- `.github/workflows/azure-infrastructure.yml`: manually validates and provisions the two App Service apps.
- `.github/workflows/azure-app-service.yml`: tests and builds pull requests, then deploys `main` to the protected `production` environment.

### Azure DevOps pipeline

The pipeline at `azure-pipelines.yml` tests, builds, packages, and deploys both apps. Pull requests run CI without deployment. The separate `azure-pipelines-infra.yml` pipeline provisions infrastructure manually.

Authentication and required pipeline variables are documented in `.azure/pipeline-setup.md`. Both systems use workload identity federation and Azure AD bearer-authenticated OneDeploy, so SCM basic authentication and publishing passwords remain disabled.

## Deployed services

| Service | URL |
| --- | --- |
| API | https://player-loyalty-poc-api-nzmulhu74ydfe.azurewebsites.net |
| Swagger UI | https://player-loyalty-poc-api-nzmulhu74ydfe.azurewebsites.net/swagger/ |
| Frontend | https://player-loyalty-poc-web-nzmulhu74ydfe.azurewebsites.net |
| Azure DevOps project | https://dev.azure.com/csdmichael/Player-Loyalty-POC |

## Requirement traceability

| Requirement | Implementation |
| --- | --- |
| US-101 Registration | Registration form, age/consent validation, masked password, Entra ID cue |
| US-201 Rewards dashboard | Balance, tier progress, metrics, recent point transactions |
| US-301 Offer management | Filters, balance checks, redemption/activation, confirmation state |
| US-401 Notification preferences | Channel/category toggles, quiet hours, save state |
| API integration | Config-backed player, activity, offer, redemption, and preference endpoints |

## Accessibility and security notes

- Native form labels, keyboard focus indicators, switch semantics, status/error announcements, and reduced-motion support are included.
- Password input remains masked and no form values are logged.
- Authentication, KYC, durable persistence, and audit logging require production service integration.
- The JSON-backed API is intentionally process-local; restarting the API resets mutations to the source-controlled seed data.
