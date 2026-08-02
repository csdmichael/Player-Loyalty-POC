import express from 'express'
import { fileURLToPath } from 'node:url'

const app = express()
const port = Number(process.env.PORT ?? 8080)
const distPath = fileURLToPath(new URL('./dist', import.meta.url))

app.disable('x-powered-by')
app.get('/health', (_request, response) => response.json({ status: 'healthy' }))
app.use(express.static(distPath, { index: 'index.html', maxAge: '1h' }))
app.use((request, response, next) => {
  if (request.method !== 'GET' || request.path.includes('.')) return next()
  return response.sendFile('index.html', { root: distPath })
})

app.listen(port, () => console.log(`L&W Rewards web app listening on port ${port}`))