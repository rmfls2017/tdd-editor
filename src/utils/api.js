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
  //  DataSources (read-only, for error codes etc.)
  // ═══════════════════════════════════════
  getDataSource: (id) => fetch(`${API_BASE}/dataSources/${id}`).then(handleResponse),

}
