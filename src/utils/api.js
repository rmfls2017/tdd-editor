const API_BASE = '/api'

const jsonHeaders = { 'Content-Type': 'application/json' }

const handleResponse = async (res) => {
  if (!res.ok) throw new Error(`HTTP ${res.status}`)
  return res.json()
}

export const api = {
  // ═══════════════════════════════════════
  //  TDD
  // ═══════════════════════════════════════
  getTddList: () => fetch(`${API_BASE}/tdd`).then(handleResponse),

  getTdd: (id) => fetch(`${API_BASE}/tdd/${id}`).then(handleResponse),

  createTdd: (tdd) => fetch(`${API_BASE}/tdd`, {
    method: 'POST',
    headers: jsonHeaders,
    body: JSON.stringify(tdd)
  }).then(handleResponse),

  updateTdd: (id, tdd) => fetch(`${API_BASE}/tdd/${id}`, {
    method: 'PUT',
    headers: jsonHeaders,
    body: JSON.stringify(tdd)
  }).then(handleResponse),

  deleteTdd: (id) => fetch(`${API_BASE}/tdd/${id}`, {
    method: 'DELETE'
  }).then(handleResponse),

  // ═══════════════════════════════════════
  //  Transforms
  // ═══════════════════════════════════════
  getTransforms: () => fetch(`${API_BASE}/transforms`).then(handleResponse),

  getTransform: (id) => fetch(`${API_BASE}/transforms/${id}`).then(handleResponse),

  createTransform: (transform) => fetch(`${API_BASE}/transforms`, {
    method: 'POST',
    headers: jsonHeaders,
    body: JSON.stringify(transform)
  }).then(handleResponse),

  updateTransform: (id, transform) => fetch(`${API_BASE}/transforms/${id}`, {
    method: 'PUT',
    headers: jsonHeaders,
    body: JSON.stringify(transform)
  }).then(handleResponse),

  deleteTransform: (id) => fetch(`${API_BASE}/transforms/${id}`, {
    method: 'DELETE'
  }).then(handleResponse),

  // ═══════════════════════════════════════
  //  DataSources
  // ═══════════════════════════════════════
  getDataSources: () => fetch(`${API_BASE}/dataSources`).then(handleResponse),

  getDataSource: (id) => fetch(`${API_BASE}/dataSources/${id}`).then(handleResponse),

  createDataSource: (ds) => fetch(`${API_BASE}/dataSources`, {
    method: 'POST',
    headers: jsonHeaders,
    body: JSON.stringify(ds)
  }).then(handleResponse),

  updateDataSource: (id, ds) => fetch(`${API_BASE}/dataSources/${id}`, {
    method: 'PUT',
    headers: jsonHeaders,
    body: JSON.stringify(ds)
  }).then(handleResponse),

  deleteDataSource: (id) => fetch(`${API_BASE}/dataSources/${id}`, {
    method: 'DELETE'
  }).then(handleResponse),

  // ═══════════════════════════════════════
  //  Pipelines
  // ═══════════════════════════════════════
  getPipeline: (tddId) => fetch(`${API_BASE}/pipelines/${tddId}`).then(handleResponse),

  updatePipeline: (tddId, pipeline) => fetch(`${API_BASE}/pipelines/${tddId}`, {
    method: 'PUT',
    headers: jsonHeaders,
    body: JSON.stringify(pipeline)
  }).then(handleResponse),

  // ═══════════════════════════════════════
  //  ValidationRules
  // ═══════════════════════════════════════
  getValidationRules: (tddId) => fetch(`${API_BASE}/validationRules/${tddId}`).then(handleResponse),

  updateValidationRules: (tddId, rules) => fetch(`${API_BASE}/validationRules/${tddId}`, {
    method: 'PUT',
    headers: jsonHeaders,
    body: JSON.stringify(rules)
  }).then(handleResponse),
}
