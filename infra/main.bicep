@description('Existing Linux App Service Plan name in this resource group.')
param appServicePlanName string = 'plan-taxforms'

@description('Globally unique base name for the frontend and API apps.')
param appNamePrefix string = 'player-loyalty-poc'

@description('Location must match the existing App Service Plan.')
param location string = resourceGroup().location

var nameSuffix = uniqueString(subscription().id, resourceGroup().id)
var apiAppName = '${appNamePrefix}-api-${nameSuffix}'
var webAppName = '${appNamePrefix}-web-${nameSuffix}'
var apiOrigin = 'https://${apiAppName}.azurewebsites.net'
var webOrigin = 'https://${webAppName}.azurewebsites.net'

resource appServicePlan 'Microsoft.Web/serverfarms@2024-04-01' existing = {
  name: appServicePlanName
}

resource apiApp 'Microsoft.Web/sites@2024-04-01' = {
  name: apiAppName
  location: location
  kind: 'app,linux'
  properties: {
    serverFarmId: appServicePlan.id
    httpsOnly: true
    clientAffinityEnabled: false
    publicNetworkAccess: 'Enabled'
    siteConfig: {
      appCommandLine: 'node api-dist/server.js'
      alwaysOn: true
      ftpsState: 'Disabled'
      healthCheckPath: '/health'
      http20Enabled: true
      linuxFxVersion: 'NODE|22-lts'
      minTlsVersion: '1.2'
      appSettings: [
        { name: 'FRONTEND_ORIGIN', value: webOrigin }
        { name: 'SCM_DO_BUILD_DURING_DEPLOYMENT', value: 'true' }
        { name: 'WEBSITE_NODE_DEFAULT_VERSION', value: '~22' }
      ]
    }
  }
}

resource webApp 'Microsoft.Web/sites@2024-04-01' = {
  name: webAppName
  location: location
  kind: 'app,linux'
  properties: {
    serverFarmId: appServicePlan.id
    httpsOnly: true
    clientAffinityEnabled: false
    publicNetworkAccess: 'Enabled'
    siteConfig: {
      appCommandLine: 'node web-server.mjs'
      alwaysOn: true
      ftpsState: 'Disabled'
      healthCheckPath: '/health'
      http20Enabled: true
      linuxFxVersion: 'NODE|22-lts'
      minTlsVersion: '1.2'
      appSettings: [
        { name: 'API_URL', value: apiOrigin }
        { name: 'SCM_DO_BUILD_DURING_DEPLOYMENT', value: 'true' }
        { name: 'WEBSITE_NODE_DEFAULT_VERSION', value: '~22' }
      ]
    }
  }
}

output services object = {
  apiAppName: apiApp.name
  apiUrl: apiOrigin
  swaggerUrl: '${apiOrigin}/swagger/'
  webAppName: webApp.name
  webUrl: webOrigin
}
