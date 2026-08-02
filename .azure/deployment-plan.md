# Azure DevOps Pipeline Deployment Plan

Status: Awaiting Approval

## Scope

Add and register an Azure DevOps YAML pipeline that builds the existing React/Vite application and deploys the generated `dist/` directory to Azure Static Web Apps.

## Source

- Primary source: GitHub repository `csdmichael/Player-Loyalty-POC`, branch `main`.
- Azure Repos is currently empty because Git push authentication was rejected.
- Pipeline registration will use an existing GitHub service connection when available.

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

## Out of Scope

- Provisioning or changing the Azure Static Web App resource.
- Creating or rotating its deployment token.
- Replacing the existing GitHub Actions workflow.