import { useEffect, useState } from "react"
import api from "../api/client"

function Dashboard(){
    const [health,setHealth] = useState(null);
    const [testKey,setTestKey] = useState('free-test-key')
    const [result,setResult] = useState(null);
    const [error,setError] = useState(null);

    useEffect(()=>{
        api.get('/health')
        .then(res=> setHealth(res.data))
        .catch(()=> setHealth({status:'unreachable'}))
    },[])

    const runCheck = async ()=>{
        setError(null);
        setResult(null);
        try {
            const res = await api.post('/api/check',{},{
                headers:{'x-api-key':testKey}
            })
            setResult(res.data)
        } catch (err) {
            setError(err.response?.data || {message:'Request failed'})
        }
    }

    return (
        <div className="max-w-2xl space-y-6">
          <div className="bg-white rounded-lg border border-gray-200 p-5">
            <h2 className="text-sm font-semibold text-gray-500 mb-3">SERVICE HEALTH</h2>
            {health ? (
              <div className="flex items-center gap-3">
                <span className={`w-2 h-2 rounded-full ${health.status === 'healthy' ? 'bg-green-500' : 'bg-red-500'}`}></span>
                <span className="text-sm font-medium">{health.status}</span>
                {health.services && (
                  <span className="text-sm text-gray-500">Redis: {health.services.redis}</span>
                )}
              </div>
            ) : (
              <p className="text-sm text-gray-400">Checking...</p>
            )}
          </div>

          <div className="bg-white rounded-lg border border-gray-200 p-5">
            <h2 className="text-sm font-semibold text-gray-500 mb-3">TEST RATE LIMIT CHECK</h2>
            <div className="flex gap-2 mb-4">
              <select
                value={testKey}
                onChange={(e) => setTestKey(e.target.value)}
                className="border border-gray-300 rounded px-3 py-2 text-sm flex-1"
              >
                <option value="free-test-key">Free Plan</option>
                <option value="pro-test-key">Pro Plan</option>
                <option value="enterprise-test-key">Enterprise Plan</option>
              </select>
              <button
                onClick={runCheck}
                className="bg-indigo-600 text-white px-4 py-2 rounded text-sm font-medium hover:bg-indigo-700"
              >
                Send Request
              </button>
            </div>

            {result && (
              <div className="text-sm space-y-1 bg-green-50 border border-green-200 rounded p-3">
                <p><span className="font-medium">Allowed:</span> {String(result.allowed)}</p>
                <p><span className="font-medium">Remaining:</span> {result.remaining}</p>
                <p><span className="font-medium">Resets at:</span> {new Date(result.resetAt).toLocaleTimeString()}</p>
              </div>
            )}

            {error && (
              <div className="text-sm bg-red-50 border border-red-200 rounded p-3 text-red-700">
                <p className="font-semibold">{error.message || error.error}</p>
                {/* ADDED THIS LINE TO SHOW DENIED BY */}
                {error.deniedBy && <p><span className="font-medium">Denied By:</span> {error.deniedBy}</p>}
                {error.remaining !== undefined && <p><span className="font-medium">Remaining:</span> {error.remaining}</p>}
              </div>
            )}
          </div>
        </div>
    )
}

export default Dashboard