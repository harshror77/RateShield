import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import api from '../api/client'

function Clients() {
  const [clients, setClients] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  const [newApiKey, setNewApiKey] = useState('')
  const [newClientName, setNewClientName] = useState('')
  const [newPlanId, setNewPlanId] = useState('free')
  const [newAlgorithm, setNewAlgorithm] = useState('token_bucket')

  const fetchClients = () => {
    setLoading(true)
    api.get('/api/clients', { headers: { 'x-api-key': 'free-test-key' } })
      .then(res => setClients(res.data.clients))
      .catch(() => setError('Failed to load clients'))
      .finally(() => setLoading(false))
  }

  useEffect(() => {
    fetchClients()
  }, [])

  const handleCreate = async (e) => {
    e.preventDefault()
    setError(null)
    try {
      await api.post('/api/clients', {
        apiKey: newApiKey,
        clientName: newClientName,
        planId: newPlanId,
        algorithm: newAlgorithm,
      }, { headers: { 'x-api-key': 'free-test-key' } })
      setNewApiKey('')
      setNewClientName('')
      fetchClients()
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to create client')
    }
  }

  const handleDelete = async (apiKey) => {
    try {
      await api.delete(`/api/clients/${apiKey}`, { headers: { 'x-api-key': 'free-test-key' } })
      fetchClients()
    } catch {
      setError('Failed to delete client')
    }
  }

  return (
    <div className="max-w-3xl space-y-6">
      <div className="bg-white rounded-lg border border-gray-200 p-5">
        <h2 className="text-sm font-semibold text-gray-500 mb-3">ADD NEW CLIENT</h2>
        <form onSubmit={handleCreate} className="grid grid-cols-2 gap-3">
          <input
            type="text"
            placeholder="API Key"
            value={newApiKey}
            onChange={(e) => setNewApiKey(e.target.value)}
            className="border border-gray-300 rounded px-3 py-2 text-sm"
            required
          />
          <input
            type="text"
            placeholder="Client Name"
            value={newClientName}
            onChange={(e) => setNewClientName(e.target.value)}
            className="border border-gray-300 rounded px-3 py-2 text-sm"
            required
          />
          <select
            value={newPlanId}
            onChange={(e) => setNewPlanId(e.target.value)}
            className="border border-gray-300 rounded px-3 py-2 text-sm"
          >
            <option value="free">Free</option>
            <option value="pro">Pro</option>
            <option value="enterprise">Enterprise</option>
          </select>
          <select
            value={newAlgorithm}
            onChange={(e) => setNewAlgorithm(e.target.value)}
            className="border border-gray-300 rounded px-3 py-2 text-sm"
          >
            <option value="token_bucket">Token Bucket</option>
            <option value="sliding_window">Sliding Window</option>
            <option value="fixed_window">Fixed Window</option>
          </select>
          <button
            type="submit"
            className="col-span-2 bg-indigo-600 text-white py-2 rounded text-sm font-medium hover:bg-indigo-700"
          >
            Create Client
          </button>
        </form>
      </div>

      {error && (
        <div className="text-sm bg-red-50 border border-red-200 rounded p-3 text-red-700">{error}</div>
      )}

      <div className="bg-white rounded-lg border border-gray-200">
        <h2 className="text-sm font-semibold text-gray-500 p-5 pb-3">ALL CLIENTS</h2>
        {loading ? (
          <p className="text-sm text-gray-400 px-5 pb-5">Loading...</p>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="border-t border-gray-200 text-left text-gray-500">
                <th className="px-5 py-2">API Key</th>
                <th className="px-5 py-2">Name</th>
                <th className="px-5 py-2">Plan</th>
                <th className="px-5 py-2">Algorithm</th>
                <th className="px-5 py-2"></th>
              </tr>
            </thead>
            <tbody>
              {clients.map((client) => (
                <tr key={client.apiKey} className="border-t border-gray-200">
                  <td className="px-5 py-3">
                    <Link to={`/clients/${client.apiKey}`} className="text-indigo-600 hover:underline">
                      {client.apiKey}
                    </Link>
                  </td>
                  <td className="px-5 py-3">{client.clientName}</td>
                  <td className="px-5 py-3">{client.planId}</td>
                  <td className="px-5 py-3">{client.algorithm}</td>
                  <td className="px-5 py-3 text-right">
                    <button
                      onClick={() => handleDelete(client.apiKey)}
                      className="text-red-600 hover:underline"
                    >
                      Delete
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  )
}

export default Clients