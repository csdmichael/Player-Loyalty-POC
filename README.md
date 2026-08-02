# L&W Rewards Player Loyalty

A responsive proof of concept for the L&W Rewards mobile experience. The application translates the supplied UX mockups and requirements into an interactive React client that runs on desktop and mobile browsers.

## Features

- **Registration and identity (SCR-01):** validated account form, 21+ age gate, consent, sign-in path, and Microsoft Entra ID trust cue.
- **Rewards dashboard (SCR-02):** live points balance, Gold-to-Platinum progress, member metrics, and recent activity ledger.
- **Offer management (SCR-03):** category filters, eligibility-aware redemption, point deduction, activation, and confirmation codes.
- **Notification preferences (SCR-04):** channel and category controls, quiet hours, responsible-gaming preference, and save confirmation.
- Responsive authenticated bottom navigation across Home, Rewards, Alerts, and Profile.

This POC uses local in-memory state so product behavior can be demonstrated without backend dependencies. Production integration points include Entra External ID, a loyalty ledger API, offer eligibility/redemption APIs, and a consent preference service.

## Technology

- React 19 and TypeScript
- Vite 8
- Lucide React icons
- Oxlint
- Azure Static Web Apps deployment through GitHub Actions

## Local development

Prerequisites: Node.js 20 or later and npm.

```bash
npm install
npm run dev
```

Open the URL printed by Vite. Use **Create account** or **Sign in** to enter the authenticated experience.

## Quality checks

```bash
npm run lint
npm run build
npm run preview
```

The production output is written to `dist/`.

## Azure deployment

The workflow at `.github/workflows/azure-static-web-apps.yml` deploys `main` to Azure Static Web Apps and creates pull-request preview environments.

1. Create an Azure Static Web App and select **Other** as the deployment source, or open an existing Static Web App.
2. In the Azure portal, open **Manage deployment token** and copy the token.
3. In the GitHub repository, create an Actions secret named `AZURE_STATIC_WEB_APPS_API_TOKEN` containing that token.
4. Push to `main` or manually run the workflow.

The workflow performs a clean install, lint, production build, and deployment. Pull-request environments are removed automatically when the pull request closes.

### Azure DevOps pipeline

The pipeline at `azure-pipelines.yml` provides the same deployment path from Azure DevOps. It runs on pushes and pull requests targeting `main`, installs dependencies with Node.js 22, lints, builds, and deploys the generated `dist/` directory.

Before the first run, add a secret pipeline variable named `AZURE_STATIC_WEB_APPS_API_TOKEN` containing the Static Web Apps deployment token. Keep the value secret and do not store it in source control.

## Requirement traceability

| Requirement | Implementation |
| --- | --- |
| US-101 Registration | Registration form, age/consent validation, masked password, Entra ID cue |
| US-201 Rewards dashboard | Balance, tier progress, metrics, recent point transactions |
| US-301 Offer management | Filters, balance checks, redemption/activation, confirmation state |
| US-401 Notification preferences | Channel/category toggles, quiet hours, save state |

## Accessibility and security notes

- Native form labels, keyboard focus indicators, switch semantics, status/error announcements, and reduced-motion support are included.
- Password input remains masked and no form values are logged.
- Authentication, KYC, persistence, audit logging, and server-side idempotency require production service integration.
