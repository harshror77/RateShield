import { useEffect, useState, useCallback } from 'react'
import api from '../api/client'

function Dashboard() {
  const [health, setHealth] = useState(null)
  const [stats, setStats] = useState(null)
  const [auditLog, setAuditLog] = useState([])
  const [autoRefresh, setAutoRefresh] = useState(false)
  const [selectedClient, setSelectedClient] = useState('ALL')
  const [registeredClients, setRegisteredClients] = useState([])

  const fetchAll = useCallback(async () => {
    try {
      const auditUrl = selectedClient === 'ALL' 
        ? '/api/check/audit?limit=20' 
        : `/api/check/audit?limit=20&apiKey=${selectedClient}`

      const [healthRes, statsRes, auditRes, clientsRes] = await Promise.all([
        api.get('/health'),
        api.get('/api/check/stats', { headers: { 'x-api-key': 'free-test-key' } }),
        api.get(auditUrl, { headers: { 'x-api-key': 'free-test-key' } }),
        api.get('/api/clients', { headers: { 'x-api-key': 'free-test-key' } }),
      ])
      
      setHealth(healthRes.data)
      setStats(statsRes.data)
      setAuditLog(auditRes.data.entries)
      setRegisteredClients(clientsRes.data.clients || [])
    } catch {
      setHealth({ status: 'unreachable' })
    }
  }, [selectedClient])

  useEffect(() => {
    const loadInitialData = async () => {
      await fetchAll();
    };
    loadInitialData();
  }, [fetchAll])

  useEffect(() => {
    if (!autoRefresh) return
    const interval = setInterval(fetchAll, 3000)
    return () => clearInterval(interval)
  }, [autoRefresh, fetchAll])

  const getProjectName = (apiKey) => {
    const client = registeredClients.find(c => c.apiKey === apiKey);
    return client ? client.clientName : apiKey;
  }

  const handleClearCache = async () => {
    if (!window.confirm("Are you sure you want to wipe all traffic history and reset all rate limits?")) return;
    try {
      await api.delete('/api/check/cache', { headers: { 'x-api-key': 'free-test-key' } });
      await fetchAll();
    } catch{
      console.error("Failed to clear cache");
    }
  }

  return (
    <div className="space-y-6">

      <div className="grid grid-cols-3 gap-4">
        <div className="bg-white border border-gray-200 rounded-lg p-4">
          <p className="text-xs text-gray-500 mb-1">SERVICE</p>
          <div className="flex items-center gap-2">
            <span className={`w-2 h-2 rounded-full ${health?.status === 'healthy' ? 'bg-green-500' : 'bg-red-500'}`}></span>
            <span className="font-medium text-sm">{health?.status || 'checking...'}</span>
            {health?.services && <span className="text-xs text-gray-400">Redis: {health.services.redis}</span>}
          </div>
        </div>

        <div className="bg-white border border-gray-200 rounded-lg p-4">
          <p className="text-xs text-gray-500 mb-1">LAST MINUTE</p>
          {stats ? (
            <div className="flex gap-4 text-sm">
              <span className="text-green-600 font-medium">{stats.lastMinute.allowed} allowed</span>
              <span className="text-red-600 font-medium">{stats.lastMinute.denied} denied</span>
            </div>
          ) : <p className="text-xs text-gray-400">No data yet</p>}
        </div>

        <div className="bg-white border border-gray-200 rounded-lg p-4">
          <p className="text-xs text-gray-500 mb-1">LAST HOUR</p>
          {stats ? (
            <div className="flex gap-4 text-sm">
              <span className="text-green-600 font-medium">{stats.lastHour.allowed} allowed</span>
              <span className="text-red-600 font-medium">{stats.lastHour.denied} denied</span>
            </div>
          ) : <p className="text-xs text-gray-400">No data yet</p>}
        </div>
      </div>

      {stats?.byClient && Object.keys(stats.byClient).length > 0 && (
        <div className="bg-white border border-gray-200 rounded-lg p-5">
          <p className="text-xs font-semibold text-gray-500 mb-3">REQUESTS BY PROJECT (LAST MINUTE)</p>
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-gray-500 border-b border-gray-200">
                <th className="pb-2">Project Name</th>
                <th className="pb-2">Total</th>
                <th className="pb-2">Allowed</th>
                <th className="pb-2">Denied</th>
                <th className="pb-2">Deny Rate</th>
              </tr>
            </thead>
            <tbody>
              {Object.entries(stats.byClient).map(([key, data]) => (
                <tr key={key} className="border-b border-gray-100">
                  <td className="py-2 font-medium text-gray-800">{getProjectName(key)}</td>
                  <td className="py-2">{data.total}</td>
                  <td className="py-2 text-green-600">{data.allowed}</td>
                  <td className="py-2 text-red-600">{data.denied}</td>
                  <td className="py-2">
                    <div className="flex items-center gap-2">
                      <div className="w-20 h-1.5 bg-gray-200 rounded">
                        <div
                          className="h-1.5 bg-red-500 rounded"
                          style={{ width: `${data.total ? (data.denied / data.total) * 100 : 0}%` }}
                        ></div>
                      </div>
                      <span className="text-xs text-gray-500">
                        {data.total ? Math.round((data.denied / data.total) * 100) : 0}%
                      </span>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <div className="bg-white border border-gray-200 rounded-lg p-5">
        <div className="flex justify-between items-center mb-4">
          
          <div className="flex items-center gap-4">
            <p className="text-xs font-semibold text-gray-500">RECENT REQUESTS</p>
            <select
              value={selectedClient}
              onChange={(e) => setSelectedClient(e.target.value)}
              className="text-xs border border-gray-300 rounded px-2 py-1 outline-none focus:border-indigo-500 bg-gray-50"
            >
              <option value="ALL">All Projects</option>
              {registeredClients.map(client => (
                <option key={client.apiKey} value={client.apiKey}>
                  {client.clientName}
                </option>
              ))}
            </select>
          </div>

          <div className="flex items-center gap-4">
            <label className="flex items-center gap-2 text-xs text-gray-500 cursor-pointer">
              <input
                type="checkbox"
                checked={autoRefresh}
                onChange={e => setAutoRefresh(e.target.checked)}
                className="cursor-pointer"
              />
              Auto-refresh every 3s
            </label>

            <button onClick={handleClearCache} className="text-xs text-red-600 font-medium hover:underline">
              Clear Cache
            </button>

            <button onClick={fetchAll} className="text-xs text-indigo-600 hover:underline">
              Refresh now
            </button>
          </div>
        </div>

        {auditLog.length === 0 ? (
          <p className="text-sm text-gray-400">No requests found for this selection.</p>
        ) : (
          <table className="w-full text-xs">
            <thead>
              <tr className="text-left text-gray-500 border-b border-gray-200">
                <th className="pb-2">Time</th>
                <th className="pb-2">Project</th>
                <th className="pb-2">IP</th>
                <th className="pb-2">Result</th>
                <th className="pb-2">Denied By</th>
                <th className="pb-2">Remaining</th>
              </tr>
            </thead>
            <tbody>
              {auditLog.map((entry, i) => (
                <tr key={i} className="border-b border-gray-100">
                  <td className="py-1.5 text-gray-400">{new Date(entry.timestamp).toLocaleTimeString()}</td>
                  <td className="py-1.5 font-medium text-gray-700">{getProjectName(entry.apiKey)}</td>
                  <td className="py-1.5 text-gray-500">{entry.ip}</td>
                  <td className="py-1.5">
                    <span className={`px-2 py-0.5 rounded text-xs font-medium ${entry.allowed ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                      {entry.allowed ? 'allowed' : 'denied'}
                    </span>
                  </td>
                  <td className="py-1.5 text-gray-500">{entry.deniedBy || '—'}</td>
                  <td className="py-1.5">{entry.remaining ?? '—'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

    </div>
  )
}

export default Dashboard