# Azure DevOps Pipeline Deployment Plan

Status: Ready for Validation

## Scope

Add and register an Azure DevOps YAML pipeline that builds the existing React/Vite application and deploys the generated `dist/` directory to Azure Static Web Apps.

## Source

- Publish the pipeline definition to GitHub repository `csdmichael/Player-Loyalty-POC`, branch `main`.
- Import the public GitHub repository into the empty Azure Repo server-side.
- Register the pipeline against Azure Repos so no new GitHub OAuth service connection is required.

## Pipeline

1. Add `azure-pipelines.yml` at the repository root.
2. Use an Ubuntu Microsoft-hosted agent and Node.js 22.
3. Run `npm ci`, `npm run lint`, and `npm run build`.
4. Deploy `dist/` with the Azure Static Web Apps pipeline task.
5. Read the deployment token from a secret pipeline variable named `AZURE_STATIC_WEB_APPS_API_TOKEN`.

## Security

- Do not store deployment credentials in source control.
- Keep the Static Web Apps deployment token secret in Azure Pipelines.
- Restrict pipeline source triggers to `main`.

## Validation

- Validate YAML structure and referenced task inputs.
- Run the same lint and production build commands locally.
- Create the pipeline in the `Player-Loyalty-POC` Azure DevOps project.
- Verify the pipeline definition and report any remaining authorization or secret setup requirement.

Current target check: no Azure Static Web App was visible to the active Azure CLI subscription or Azure MCP tenant. Pipeline registration will therefore skip its first run until `AZURE_STATIC_WEB_APPS_API_TOKEN` is configured from the intended resource.

## Out of Scope

- Provisioning or changing the Azure Static Web App resource.
- Creating or rotating its deployment token.
- Replacing the existing GitHub Actions workflow.