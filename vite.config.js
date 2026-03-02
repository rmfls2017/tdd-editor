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
  const transforms = (tdd.transformRefs || []).map(id => {
    const filePath = path.join(DATA_DIR, 'transforms', `${id}.json`)
    return readJson(filePath)
  }).filter(Boolean)

  const dataSources = (tdd.dataSourceRefs || []).map(id => {
    const filePath = path.join(DATA_DIR, 'dataSources', `${id}.json`)
    return readJson(filePath)
  }).filter(Boolean)

  const pipelineFile = path.join(DATA_DIR, 'pipelines', `${tdd.id}.json`)
  const pipelineData = readJson(pipelineFile)

  const validationFile = path.join(DATA_DIR, 'validationRules', `${tdd.id}.json`)
  const validationData = readJson(validationFile)

  return {
    ...tdd,
    transforms,
    dataSources,
    pipeline: pipelineData ? { steps: pipelineData.steps } : { steps: [] },
    validationRules: validationData ? validationData.rules : []
  }
}

// Extract refs from TDD for saving (inverse of resolve)
const extractRefs = (tdd) => {
  const transformRefs = (tdd.transforms || []).map(t => t.id)
  const dataSourceRefs = (tdd.dataSources || []).map(d => d.id)

  // Remove embedded data, keep only refs
  const { transforms, dataSources, pipeline, validationRules, ...rest } = tdd

  return {
    ...rest,
    transformRefs,
    dataSourceRefs
  }
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

            // Save embedded transforms
            if (tdd.transforms) {
              tdd.transforms.forEach(t => {
                const tfPath = path.join(DATA_DIR, 'transforms', `${t.id}.json`)
                writeJson(tfPath, t)
              })
            }

            // Save embedded dataSources
            if (tdd.dataSources) {
              tdd.dataSources.forEach(d => {
                const dsPath = path.join(DATA_DIR, 'dataSources', `${d.id}.json`)
                writeJson(dsPath, d)
              })
            }

            // Save pipeline
            if (tdd.pipeline) {
              const pipePath = path.join(DATA_DIR, 'pipelines', `${tdd.id}.json`)
              writeJson(pipePath, { tddId: tdd.id, steps: tdd.pipeline.steps || [] })
            }

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

            // Save embedded transforms
            if (tdd.transforms) {
              tdd.transforms.forEach(t => {
                const tfPath = path.join(DATA_DIR, 'transforms', `${t.id}.json`)
                writeJson(tfPath, t)
              })
            }

            // Save embedded dataSources
            if (tdd.dataSources) {
              tdd.dataSources.forEach(d => {
                const dsPath = path.join(DATA_DIR, 'dataSources', `${d.id}.json`)
                writeJson(dsPath, d)
              })
            }

            // Save pipeline
            if (tdd.pipeline) {
              const pipePath = path.join(DATA_DIR, 'pipelines', `${id}.json`)
              writeJson(pipePath, { tddId: id, steps: tdd.pipeline.steps || [] })
            }

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
              // Also delete pipeline and validationRules
              const pipePath = path.join(DATA_DIR, 'pipelines', `${id}.json`)
              const vrPath = path.join(DATA_DIR, 'validationRules', `${id}.json`)
              if (fs.existsSync(pipePath)) fs.unlinkSync(pipePath)
              if (fs.existsSync(vrPath)) fs.unlinkSync(vrPath)
            }
            return sendJson(res, { success: true })
          }

          next()
        })

        // ═══════════════════════════════════════
        //  Transforms API
        // ═══════════════════════════════════════
        server.middlewares.use('/api/transforms', (req, res, next) => {
          const url = new URL(req.url, 'http://localhost')
          const pathParts = url.pathname.split('/').filter(Boolean)
          const id = pathParts[0]
          const transformsDir = path.join(DATA_DIR, 'transforms')

          // GET /api/transforms
          if (req.method === 'GET' && !id) {
            const files = listJsonFiles(transformsDir)
            const transforms = files.map(f => readJson(path.join(transformsDir, f))).filter(Boolean)
            return sendJson(res, transforms)
          }

          // GET /api/transforms/:id
          if (req.method === 'GET' && id) {
            const filePath = path.join(transformsDir, `${id}.json`)
            const transform = readJson(filePath)
            if (!transform) return sendJson(res, { error: 'Not found' }, 404)
            return sendJson(res, transform)
          }

          // POST /api/transforms
          if (req.method === 'POST') {
            const transform = req.body
            if (!transform.id) return sendJson(res, { error: 'ID required' }, 400)
            const filePath = path.join(transformsDir, `${transform.id}.json`)
            writeJson(filePath, transform)
            return sendJson(res, transform, 201)
          }

          // PUT /api/transforms/:id
          if (req.method === 'PUT' && id) {
            const transform = req.body
            transform.id = id
            const filePath = path.join(transformsDir, `${id}.json`)
            writeJson(filePath, transform)
            return sendJson(res, transform)
          }

          // DELETE /api/transforms/:id
          if (req.method === 'DELETE' && id) {
            const filePath = path.join(transformsDir, `${id}.json`)
            if (fs.existsSync(filePath)) fs.unlinkSync(filePath)
            return sendJson(res, { success: true })
          }

          next()
        })

        // ═══════════════════════════════════════
        //  DataSources API
        // ═══════════════════════════════════════
        server.middlewares.use('/api/dataSources', (req, res, next) => {
          const url = new URL(req.url, 'http://localhost')
          const pathParts = url.pathname.split('/').filter(Boolean)
          const id = pathParts[0]
          const dsDir = path.join(DATA_DIR, 'dataSources')

          // GET /api/dataSources
          if (req.method === 'GET' && !id) {
            const files = listJsonFiles(dsDir)
            const dataSources = files.map(f => readJson(path.join(dsDir, f))).filter(Boolean)
            return sendJson(res, dataSources)
          }

          // GET /api/dataSources/:id
          if (req.method === 'GET' && id) {
            const filePath = path.join(dsDir, `${id}.json`)
            const ds = readJson(filePath)
            if (!ds) return sendJson(res, { error: 'Not found' }, 404)
            return sendJson(res, ds)
          }

          // POST /api/dataSources
          if (req.method === 'POST') {
            const ds = req.body
            if (!ds.id) return sendJson(res, { error: 'ID required' }, 400)
            const filePath = path.join(dsDir, `${ds.id}.json`)
            writeJson(filePath, ds)
            return sendJson(res, ds, 201)
          }

          // PUT /api/dataSources/:id
          if (req.method === 'PUT' && id) {
            const ds = req.body
            ds.id = id
            const filePath = path.join(dsDir, `${id}.json`)
            writeJson(filePath, ds)
            return sendJson(res, ds)
          }

          // DELETE /api/dataSources/:id
          if (req.method === 'DELETE' && id) {
            const filePath = path.join(dsDir, `${id}.json`)
            if (fs.existsSync(filePath)) fs.unlinkSync(filePath)
            return sendJson(res, { success: true })
          }

          next()
        })

        // ═══════════════════════════════════════
        //  Pipelines API
        // ═══════════════════════════════════════
        server.middlewares.use('/api/pipelines', (req, res, next) => {
          const url = new URL(req.url, 'http://localhost')
          const pathParts = url.pathname.split('/').filter(Boolean)
          const tddId = pathParts[0]
          const pipelinesDir = path.join(DATA_DIR, 'pipelines')

          if (!tddId) return next()

          // GET /api/pipelines/:tddId
          if (req.method === 'GET') {
            const filePath = path.join(pipelinesDir, `${tddId}.json`)
            const pipeline = readJson(filePath)
            if (!pipeline) return sendJson(res, { tddId, steps: [] })
            return sendJson(res, pipeline)
          }

          // PUT /api/pipelines/:tddId
          if (req.method === 'PUT') {
            const pipeline = req.body
            pipeline.tddId = tddId
            const filePath = path.join(pipelinesDir, `${tddId}.json`)
            writeJson(filePath, pipeline)
            return sendJson(res, pipeline)
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
