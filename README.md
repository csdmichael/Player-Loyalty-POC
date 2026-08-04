# L&W Rewards Player Loyalty

A responsive proof of concept for the L&W Rewards mobile experience. The application translates the supplied UX mockups and requirements into an interactive React client that runs on desktop and mobile browsers.

## Table of contents

- [Features](#features)
- [Architecture](#architecture)
- [Technology](#technology)
- [Local development](#local-development)
- [Quality checks](#quality-checks)
- [Automated test cases](#automated-test-cases)
- [Azure deployment](#azure-deployment)
- [Deployed services](#deployed-services)
- [Requirement traceability](#requirement-traceability)
- [Screenshots](#screenshots)
- [Migration tooling](#migration-tooling)
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

## Automated test cases

The automated integration test cases live in `tests/api.integration.test.ts`. Each case is prefixed with a stable `[TC-xx]` identifier and exercises the Express API end to end with supertest.

Run the whole suite locally:

```bash
npm run test:cases
```

Run a single case by matching its identifier (the flag must precede the file path):

```bash
npx tsx --test --test-name-pattern="TC-05" tests/api.integration.test.ts
```

### Test case catalogue

| Test case | Scenario | Requirement / Work item |
| --- | --- | --- |
| TC-01 | Health endpoint reports the service as healthy | Service availability |
| TC-02 | Player profile returns the seeded balance and Gold tier | US-201 Rewards dashboard |
| TC-03 | Recent activity ledger returns the seeded transactions | US-201 Rewards dashboard |
| TC-04 | Offers catalogue returns every seeded offer as not redeemed | US-301 Offer management |
| TC-05 | Redeeming an offer deducts points and returns a confirmation code | US-301 Offer management |
| TC-06 | Redemption is idempotent and a second redeem returns 409 | US-301 Offer management |
| TC-07 | Redeeming a zero-cost offer does not change the redeemed-offer metric | US-301 Offer management |
| TC-08 | Insufficient points blocks redemption with a 409 | US-301 Offer management |
| TC-09 | Unknown offer ids return 404 and non-integer ids return 400 | US-301 Offer management |
| TC-10 | Notification preferences persist a complete payload | US-401 Notification preferences |
| TC-11 | Notification preferences reject partial or invalid payloads | US-401 Notification preferences |
| TC-12 | CORS allows only the approved frontend origins | Security |
| TC-13 | Age/KYC verification blocks underage or unverified redemption | BUG 52 (fixed) |
| TC-14 | Offer-level gating enforces age-restricted content and entitlements | BUG 53 (fixed) |
| TC-54 | Eligibility pre-conditions pass then the transaction proceeds | ADO Test Case 54 (positive) |
| TC-55 | Ineligible attempt changes no balance and issues no code | ADO Test Case 55 (negative) |

TC-13 and TC-14 are regression cases for the two Azure DevOps bugs. The API now enforces age/KYC verification and offer-level entitlement gating during redemption, so both cases are active and pass. Callers supply an eligibility context (`ageVerified`, `kycStatus`, `entitlements`) on redeem; offers can declare `ageRestricted` and `requiredEntitlement` metadata.

TC-54 and TC-55 are bound to the Azure DevOps Test Cases 54 and 55 and run through the test pipeline by passing `TC-54` or `TC-55` as the `testCase` parameter.

### Test pipeline

The pipeline at `azure-pipelines-tests.yml` runs the test cases and exposes a `testCase` runtime parameter. Choose `all` to run the full suite or a specific `TC-xx` value to run one case; the pipeline forwards the value to the runner as `--test-name-pattern`. Results are published as JUnit so they appear in the Azure DevOps **Tests** tab.

The pipeline is registered in Azure DevOps as **Player Loyalty - Test Cases**. Test Cases 54 and 55 are linked to it with their matching parameter values:

| Azure DevOps test case | Pipeline `testCase` parameter | Automated test |
| --- | --- | --- |
| 54 - Positive eligibility pre-conditions | `TC-54` | `[TC-54]` in `tests/api.integration.test.ts` |
| 55 - Negative ineligible attempt | `TC-55` | `[TC-55]` in `tests/api.integration.test.ts` |

To bind an Azure DevOps test case to this pipeline:

1. Open the test case in **Boards > Test Plans** and go to the test case's **Associated Automation**.
2. Point it at the **Player Loyalty - Test Cases** pipeline.
3. Set the pipeline's `testCase` parameter to the matching identifier (for example, `TC-54`) so running the ADO test case executes only that automated case.

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

## Screenshots

The images below capture the Azure DevOps and GitHub integration used to drive work items and pull requests for this project. Files live in `docs/screenshots/`.

### 1. Add the GitHub repository to Azure DevOps

![Add GitHub repositories panel in Azure DevOps with the Player-Loyalty-POC repository selected](docs/screenshots/01-ADO-GitHub%20Connection.png)

In **Project Settings > GitHub connections**, the "Add GitHub repositories" panel filters on "Player" and selects `csdmichael/Player-Loyalty-POC` to link the repository to Azure Boards.

### 2. GitHub connection established

![Azure DevOps GitHub connections list showing the connected csdmichael GitHub App](docs/screenshots/02-ADO-GitHub%20Connection-2.png)

The completed connection shows the `csdmichael` GitHub App authentication type bound to the `csdmichael/Player-Loyalty-POC` repository, enabling commits and pull requests to link back to work items.

### 3. Create a pull request with GitHub Copilot

![BUG 53 work item with the Create a pull request with GitHub Copilot action highlighted](docs/screenshots/03-ADO-GitHub%20Pull%20Request%20using%20GitHub%20Copilot%20Agent.png)

Work item **BUG 53** ("Offer-level gating ignores age-restricted content and entitlement requirements") exposes the **Create a pull request with GitHub Copilot** action, handing the bug to the Copilot coding agent.

### 4. Work item development links

![BUG 52 work item Development section with linked branch, merged pull request, and commit](docs/screenshots/04-ADO-GitHub%20Review%20PR.png)

Work item **BUG 52** ("Age/KYC verification bypass allows redemption for underage or unverified users") shows the Development section with the linked GitHub branch, the merged pull request #2, and the merge commit, plus the "Pull request is ready for review" status from the Copilot coding agent.

### 5. Copilot coding agent discussion

![BUG 52 discussion thread with GitHub Copilot coding agent progress comments](docs/screenshots/05-ADO-GitHub%20Copilot%20Agent%20Comments.png)

The BUG 52 Discussion thread records the GitHub Copilot coding agent acknowledging the assignment, linking its work-in-progress pull request, and later reporting that the pull request is ready for review.

## Migration tooling

Recommended tools for migrating collaboration and engineering systems onto the Microsoft toolchain. The Perforce guidance intentionally uses a **hybrid** model: move light, code-centric repositories to GitHub while keeping asset-heavy game projects on Perforce Helix Core.

| Migration | Recommended tool(s) | Why | Notes |
| --- | --- | --- | --- |
| **Jira → Azure DevOps Boards** | Microsoft **Azure DevOps Migration Tools** (community `azure-devops-migration-tools`); commercial options: **Solidify Atlas**, **OpsHub**, **Transporter for Jira** | Preserves work-item hierarchy, history, comments, attachments, and links; supports field/state mapping and iterative delta runs | Build a field/workflow mapping first (Jira issue types → ADO work-item types, statuses → states). Migrate in waves and reconcile IDs. For small projects the Jira CSV/REST import into ADO can suffice. |
| **Confluence → SharePoint** | **AvePoint Fly / Migration**, **ShareGate**, **Microsoft SharePoint Migration Tool (SPMT)** | AvePoint and ShareGate map Confluence spaces, pages, hierarchy, attachments, and permissions to SharePoint sites/pages with fidelity reports | Native SPMT targets file shares/on-prem SharePoint, so pair it with a Confluence exporter or use AvePoint/ShareGate for direct Confluence→SharePoint Online. Rationalize spaces → sites and page trees → navigation before cutover. |
| **qTest → Azure DevOps Test Plans** | **Azure DevOps REST API** (Test Plans/Suites/Cases) with qTest export, or the **Test Case Migrator** pattern / partner services (**OpsHub**) | Recreates test plans, suites, test cases, steps, parameters, and configurations as native ADO Test Cases linked to requirements | Export qTest via its API/CSV, transform to ADO test-case schema, and bulk-create through the REST API. Re-link automated cases to pipelines (see [Automated test cases](#automated-test-cases)) after import. |
| **Perforce → GitHub** *(code-centric repos only)* | **`git p4`**, **`git-filter-repo`**, or **GitHub's Perforce import** guidance; large-scale: **Perforce-to-Git** partner tooling | For repositories that are **not** asset-heavy (little or no large binary content), a clean Git history with preserved changelist mapping is straightforward and unlocks GitHub PRs, Actions, and Copilot | Convert branch/changelist history, then enforce PR-based flow. Keep `.gitattributes` and **Git LFS** for the occasional binary. |
| **Perforce (keep) — game/asset-heavy projects** | **Perforce Helix Core** (retain as source of truth) + **Helix DAM**, **P4V**, **Unreal/Unity Perforce integration** | Large binary assets, exclusive file locking, and multi-terabyte depots are where Perforce outperforms Git/LFS; migrating them adds risk and cost with little benefit | Do **not** migrate. Optionally bridge to GitHub for code-only submodules or CI triggers, but the asset depot stays on Helix Core. |

### Hybrid Perforce + GitHub strategy

For studios that are both building the game and shipping supporting services, split the estate by content profile rather than migrating everything:

- **GitHub** — tools, backend/services, web, build scripts, and other code-centric repos with few large binaries. Gains PRs, GitHub Actions, and Copilot coding agent workflows.
- **Perforce Helix Core** — the game project and all asset-heavy content (art, audio, level data, cooked builds) that rely on large binaries and exclusive checkout.
- **Bridge** — trigger GitHub Actions or Azure Pipelines from Perforce submits (and vice versa) so CI/CD spans both systems, and use Git LFS only for stray binaries on the GitHub side.

This keeps each team on the version-control system best suited to its workload while unifying planning (Azure Boards) and automation across both.

## Accessibility and security notes

- Native form labels, keyboard focus indicators, switch semantics, status/error announcements, and reduced-motion support are included.
- Password input remains masked and no form values are logged.
- Authentication, KYC, durable persistence, and audit logging require production service integration.
- The JSON-backed API is intentionally process-local; restarting the API resets mutations to the source-controlled seed data.
