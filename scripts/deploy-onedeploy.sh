#!/usr/bin/env bash
set -euo pipefail

resource_group="${1:?resource group is required}"
app_name="${2:?app name is required}"
package_path="${3:?package path is required}"

if [[ ! -f "$package_path" ]]; then
  echo "Deployment package not found: $package_path" >&2
  exit 1
fi

token="$(az account get-access-token --resource https://management.azure.com --query accessToken --output tsv)"
default_hostname="$(az webapp show --resource-group "$resource_group" --name "$app_name" --query defaultHostName --output tsv)"
scm_url="https://${default_hostname/.azurewebsites.net/.scm.azurewebsites.net}"
headers_file="$(mktemp)"
response_file="$(mktemp)"
trap 'rm -f "$headers_file" "$response_file"' EXIT

http_status="$(curl --silent --show-error --http1.1 \
  --request POST \
  --header "Authorization: Bearer $token" \
  --header "Content-Type: application/zip" \
  --header "Expect:" \
  --data-binary "@${package_path}" \
  --dump-header "$headers_file" \
  --output "$response_file" \
  --write-out '%{http_code}' \
  --max-time 1200 \
  "${scm_url}/api/publish?type=zip&async=true&clean=true&restart=true")"

if [[ "$http_status" != "202" && "$http_status" != "200" ]]; then
  echo "OneDeploy upload for ${app_name} failed with HTTP ${http_status}." >&2
  cat "$response_file" >&2
  exit 1
fi

deployment_url="$(awk 'BEGIN { IGNORECASE=1 } /^Location:/ { sub(/^[^:]*:[[:space:]]*/, ""); sub(/\r$/, ""); print; exit }' "$headers_file")"
if [[ -z "$deployment_url" ]]; then
  deployment_url="${scm_url}/api/deployments/latest"
fi

echo "OneDeploy accepted for ${app_name}; waiting for completion."
for attempt in {1..90}; do
  deployment="$(curl --silent --show-error --fail \
    --header "Authorization: Bearer $token" \
    --max-time 60 \
    "$deployment_url")"
  status="$(node -e 'const fs=require("fs"); const value=JSON.parse(fs.readFileSync(0,"utf8")); process.stdout.write(String(value.status))' <<< "$deployment")"

  case "$status" in
    4)
      echo "OneDeploy completed for ${app_name}."
      exit 0
      ;;
    3)
      echo "OneDeploy failed for ${app_name}." >&2
      echo "$deployment" >&2
      exit 1
      ;;
  esac

  sleep 10
done

echo "Timed out waiting for OneDeploy on ${app_name}." >&2
exit 1
