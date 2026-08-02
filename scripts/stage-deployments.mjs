import { cp, mkdir, readFile, rm, writeFile } from 'node:fs/promises'
import { fileURLToPath } from 'node:url'

const root = fileURLToPath(new URL('..', import.meta.url))
const artifacts = `${root}/.artifacts`
const packageJson = JSON.parse(await readFile(`${root}/package.json`, 'utf8'))

await rm(artifacts, { recursive: true, force: true })
await mkdir(`${artifacts}/api`, { recursive: true })
await mkdir(`${artifacts}/web`, { recursive: true })

await cp(`${root}/api-dist`, `${artifacts}/api/api-dist`, { recursive: true })
await cp(`${root}/config`, `${artifacts}/api/config`, { recursive: true })
await cp(`${root}/dist`, `${artifacts}/web/dist`, { recursive: true })
await cp(`${root}/web-server.mjs`, `${artifacts}/web/web-server.mjs`)

const apiPackage = {
  name: 'player-loyalty-api',
  private: true,
  version: packageJson.version,
  type: 'module',
  scripts: { start: 'node api-dist/server.js' },
  dependencies: {
    cors: packageJson.dependencies.cors,
    express: packageJson.dependencies.express,
    'swagger-ui-express': packageJson.dependencies['swagger-ui-express'],
  },
}
const webPackage = {
  name: 'player-loyalty-web',
  private: true,
  version: packageJson.version,
  type: 'module',
  scripts: { start: 'node web-server.mjs' },
  dependencies: { express: packageJson.dependencies.express },
}

await writeFile(`${artifacts}/api/package.json`, `${JSON.stringify(apiPackage, null, 2)}\n`)
await writeFile(`${artifacts}/web/package.json`, `${JSON.stringify(webPackage, null, 2)}\n`)
console.log('Staged API and web deployment artifacts in .artifacts/.')