const API = 'http://localhost:8000/api/v1'

export async function request(path, options = {}) {
  const token = localStorage.getItem('agentgrid_token')
  const headers = {
    'Content-Type': 'application/json',
    ...(options.headers || {})
  }
  if (token) headers.Authorization = `Bearer ${token}`

  const response = await fetch(`${API}${path}`, {
    ...options,
    headers
  })

  if (!response.ok) {
    const text = await response.text()
    throw new Error(text || 'Request failed')
  }
  return response.json()
}

export { API }
