import { useEffect, useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import api from '../api/client'

function ClientDetail() {
  const { apiKey } = useParams()
  const [client, setClient] = useState(null)
  const [error, setError] = useState(null)
  const [result, setResult] = useState(null)

  useEffect(() => {
    api.get(`/api/clients/${apiKey}`, { headers: { 'x-api-key': 'free-test-key' } })
      .then(res => setClient(res.data.client))
      .catch(() => setError('Client not found'))
  }, [apiKey])

  const runCheck = async () => {
    setResult(null)
    try {
      const res = await api.post('/api/check', {}, {
        headers: { 'x-api-key': apiKey }
      })
      setResult({ ok: true, data: res.data })
    } catch (err) {
      setResult({ ok: false, data: err.response?.data })
    }
  }

  if (error) {
    return (
      <div className="max-w-xl">
        <p className="text-sm text-red-600">{error}</p>
        <Link to="/clients" className="text-sm text-indigo-600 hover:underline">Back to clients</Link>
      </div>
    )
  }

  if (!client) {
    return <p className="text-sm text-gray-400">Loading...</p>
  }

  return (
    <div className="max-w-xl space-y-6">
      <Link to="/clients" className="text-sm text-indigo-600 hover:underline">← Back to clients</Link>

      <div className="bg-white rounded-lg border border-gray-200 p-5">
        <h2 className="text-sm font-semibold text-gray-500 mb-3">CLIENT INFO</h2>
        <div className="text-sm space-y-1">
          <p><span className="font-medium">API Key:</span> {client.apiKey}</p>
          <p><span className="font-medium">Name:</span> {client.clientName}</p>
          <p><span className="font-medium">Plan:</span> {client.planId}</p>
          <p><span className="font-medium">Algorithm:</span> {client.algorithm}</p>
        </div>
      </div>

      <div className="bg-white rounded-lg border border-gray-200 p-5">
        <h2 className="text-sm font-semibold text-gray-500 mb-3">TEST THIS CLIENT</h2>
        <button
          onClick={runCheck}
          className="bg-indigo-600 text-white px-4 py-2 rounded text-sm font-medium hover:bg-indigo-700"
        >
          Send Rate Limit Check
        </button>

        {result && result.ok && (
          <div className="text-sm space-y-1 bg-green-50 border border-green-200 rounded p-3 mt-4">
            <p><span className="font-medium">Allowed:</span> {String(result.data.allowed)}</p>
            <p><span className="font-medium">Remaining:</span> {result.data.remaining}</p>
            <p><span className="font-medium">Resets at:</span> {new Date(result.data.resetAt).toLocaleTimeString()}</p>
          </div>
        )}

        {result && !result.ok && (
          <div className="text-sm bg-red-50 border border-red-200 rounded p-3 text-red-700 mt-4">
            <p>{result.data?.message || result.data?.error}</p>
            {result.data?.remaining !== undefined && <p>Remaining: {result.data.remaining}</p>}
          </div>
        )}
      </div>
    </div>
  )
}

export default ClientDetail