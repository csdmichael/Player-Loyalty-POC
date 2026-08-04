# Pipeline setup

Both pipeline systems build the same API and frontend packages. Infrastructure provisioning is deliberately separate from application deployment.

Application packages include their production dependencies and are uploaded through Kudu ZipDeploy with the Azure AD access token issued to each pipeline's workload identity. Remote Oryx builds, SCM basic authentication, and publishing-profile secrets are not required.

## Azure target

- Subscription ID: `86b37969-9445-49cf-b03f-d8866235171c`
- Resource group: `ai-myaacoub`
- Existing App Service Plan: `plan-taxforms`
- App Service Plan SKU: `B2`
- Environment: `production`

## GitHub Actions

The repository uses the `id-player-loyalty-cicd` user-assigned managed identity with Contributor scoped to `ai-myaacoub` and a federated credential for the GitHub `production` environment. Configure these repository secrets:

- `AZURE_CLIENT_ID`
- `AZURE_TENANT_ID`
- `AZURE_SUBSCRIPTION_ID`

Configure these environment variables after the infrastructure deployment returns its outputs:

- `AZURE_RESOURCE_GROUP=ai-myaacoub`
- `AZURE_API_APP_NAME=<services.apiAppName>`
- `AZURE_WEB_APP_NAME=<services.webAppName>`

Protect the GitHub `production` environment with required reviewers. Run **Provision App Service infrastructure** once, then use **Build and deploy App Service apps** for releases.

## Azure DevOps

Use the existing `player-loyalty-azure-wif` Azure Resource Manager service connection. It uses Entra-issued workload identity federation with `id-player-loyalty-cicd` and is scoped through that identity's `ai-myaacoub` role assignment. Configure these pipeline variables:

- `AZURE_SERVICE_CONNECTION=player-loyalty-azure-wif`
- `AZURE_RESOURCE_GROUP=ai-myaacoub`
- `AZURE_API_APP_NAME=<services.apiAppName>`
- `AZURE_WEB_APP_NAME=<services.webAppName>`

Create the `player-loyalty-production` environment and add its approval check. Register `azure-pipelines-infra.yml` as a manually run infrastructure pipeline and `azure-pipelines.yml` as the application pipeline.