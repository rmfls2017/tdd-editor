import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import fs from 'fs'
import path from 'path'

const DATA_DIR = path.resolve('data')

// Helper functions
const readJson = (filePath) => {
  try {
    return JSON.parse(fs.readFileSync(filePath, 'utf-8'))
  } catch (e) {
    return null
  }
}

const writeJson = (filePath, data) => {
  const dir = path.dirname(filePath)
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true })
  }
  fs.writeFileSync(filePath, JSON.stringify(data, null, 2))
}

const listJsonFiles = (dir) => {
  if (!fs.existsSync(dir)) return []
  return fs.readdirSync(dir).filter(f => f.endsWith('.json'))
}

const sendJson = (res, data, status = 200) => {
  res.statusCode = status
  res.setHeader('Content-Type', 'application/json')
  res.end(JSON.stringify(data))
}

// Resolve TDD references to full objects
const resolveTdd = (tdd) => {
  const validationFile = path.join(DATA_DIR, 'validationRules', `${tdd.id}.json`)
  const validationData = readJson(validationFile)

  return {
    ...tdd,
    validationRules: validationData ? validationData.rules : []
  }
}

// Extract refs from TDD for saving (inverse of resolve)
const extractRefs = (tdd) => {
  const { validationRules, ...rest } = tdd
  return rest
}

export default defineConfig({
  plugins: [
    react(),
    {
      name: 'tdd-api-middleware',
      configureServer(server) {
        // JSON body parser
        server.middlewares.use((req, res, next) => {
          if (req.headers['content-type']?.includes('application/json')) {
            let body = ''
            req.on('data', chunk => body += chunk)
            req.on('end', () => {
              try {
                req.body = body ? JSON.parse(body) : {}
              } catch (e) {
                req.body = {}
              }
              next()
            })
          } else {
            next()
          }
        })

        // ═══════════════════════════════════════
        //  TDD API
        // ═══════════════════════════════════════
        server.middlewares.use('/api/tdd', (req, res, next) => {
          const url = new URL(req.url, 'http://localhost')
          const pathParts = url.pathname.split('/').filter(Boolean)
          const id = pathParts[0]

          // GET /api/tdd - List all TDDs
          if (req.method === 'GET' && !id) {
            const tddDir = path.join(DATA_DIR, 'tdd')
            const files = listJsonFiles(tddDir)
            const tdds = files.map(f => {
              const tdd = readJson(path.join(tddDir, f))
              return tdd ? resolveTdd(tdd) : null
            }).filter(Boolean)
            return sendJson(res, tdds)
          }

          // GET /api/tdd/:id
          if (req.method === 'GET' && id) {
            const filePath = path.join(DATA_DIR, 'tdd', `${id}.json`)
            const tdd = readJson(filePath)
            if (!tdd) return sendJson(res, { error: 'Not found' }, 404)
            return sendJson(res, resolveTdd(tdd))
          }

          // POST /api/tdd - Create new TDD
          if (req.method === 'POST') {
            const tdd = req.body
            if (!tdd.id) return sendJson(res, { error: 'ID required' }, 400)

            // Save TDD with refs only
            const tddWithRefs = extractRefs(tdd)
            const filePath = path.join(DATA_DIR, 'tdd', `${tdd.id}.json`)
            writeJson(filePath, tddWithRefs)

            // Save validationRules
            if (tdd.validationRules) {
              const vrPath = path.join(DATA_DIR, 'validationRules', `${tdd.id}.json`)
              writeJson(vrPath, { tddId: tdd.id, rules: tdd.validationRules })
            }

            return sendJson(res, resolveTdd(readJson(filePath)), 201)
          }

          // PUT /api/tdd/:id - Update TDD
          if (req.method === 'PUT' && id) {
            const tdd = req.body
            tdd.id = id // Ensure ID matches

            // Save TDD with refs only
            const tddWithRefs = extractRefs(tdd)
            const filePath = path.join(DATA_DIR, 'tdd', `${id}.json`)
            writeJson(filePath, tddWithRefs)

            // Save validationRules
            if (tdd.validationRules) {
              const vrPath = path.join(DATA_DIR, 'validationRules', `${id}.json`)
              writeJson(vrPath, { tddId: id, rules: tdd.validationRules })
            }

            return sendJson(res, resolveTdd(readJson(filePath)))
          }

          // DELETE /api/tdd/:id
          if (req.method === 'DELETE' && id) {
            const filePath = path.join(DATA_DIR, 'tdd', `${id}.json`)
            if (fs.existsSync(filePath)) {
              fs.unlinkSync(filePath)
              // Also delete validationRules
              const vrPath = path.join(DATA_DIR, 'validationRules', `${id}.json`)
              if (fs.existsSync(vrPath)) fs.unlinkSync(vrPath)
            }
            return sendJson(res, { success: true })
          }

          next()
        })

        // ═══════════════════════════════════════
        //  DataSources API (read-only, for error codes etc.)
        // ═══════════════════════════════════════
        server.middlewares.use('/api/dataSources', (req, res, next) => {
          const url = new URL(req.url, 'http://localhost')
          const pathParts = url.pathname.split('/').filter(Boolean)
          const id = pathParts[0]
          const dsDir = path.join(DATA_DIR, 'dataSources')

          // GET /api/dataSources/:id
          if (req.method === 'GET' && id) {
            const filePath = path.join(dsDir, `${id}.json`)
            const ds = readJson(filePath)
            if (!ds) return sendJson(res, { error: 'Not found' }, 404)
            return sendJson(res, ds)
          }

          next()
        })

        // ═══════════════════════════════════════
        //  ValidationRules API
        // ═══════════════════════════════════════
        server.middlewares.use('/api/validationRules', (req, res, next) => {
          const url = new URL(req.url, 'http://localhost')
          const pathParts = url.pathname.split('/').filter(Boolean)
          const tddId = pathParts[0]
          const vrDir = path.join(DATA_DIR, 'validationRules')

          if (!tddId) return next()

          // GET /api/validationRules/:tddId
          if (req.method === 'GET') {
            const filePath = path.join(vrDir, `${tddId}.json`)
            const vr = readJson(filePath)
            if (!vr) return sendJson(res, { tddId, rules: [] })
            return sendJson(res, vr)
          }

          // PUT /api/validationRules/:tddId
          if (req.method === 'PUT') {
            const vr = req.body
            vr.tddId = tddId
            const filePath = path.join(vrDir, `${tddId}.json`)
            writeJson(filePath, vr)
            return sendJson(res, vr)
          }

          next()
        })
      }
    }
  ]
})
