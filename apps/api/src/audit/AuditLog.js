const MAX_ENTRIES = 500;
let log = [];

export function addAuditEntry(entry) {
  log.push({ ...entry, timestamp: Date.now() });
  if (log.length > MAX_ENTRIES) log.shift();
}

export function getAuditLog({ limit = 50, apiKey, allowed } = {}) {
  let results = log.slice().reverse();
  if (apiKey) results = results.filter(e => e.apiKey === apiKey);
  if (allowed !== undefined) results = results.filter(e => e.allowed === allowed);
  return results.slice(0, limit);
}

export function getStats() {
  const now = Date.now();
  const lastMinute = { total: 0, allowed: 0, denied: 0 };
  const lastHour = { total: 0, allowed: 0, denied: 0 };
  const byClient = {};

  for (let i = log.length - 1; i >= 0; i--) {
    const e = log[i];
    const diff = now - e.timestamp;
    
    if (diff >= 3600000) break;
    
    lastHour.total++;
    if (e.allowed) lastHour.allowed++; else lastHour.denied++;
    
    if (diff < 60000) {
      lastMinute.total++;
      if (e.allowed) lastMinute.allowed++; else lastMinute.denied++;
      
      if (!byClient[e.apiKey]) byClient[e.apiKey] = { total: 0, allowed: 0, denied: 0 };
      byClient[e.apiKey].total++;
      if (e.allowed) byClient[e.apiKey].allowed++; else byClient[e.apiKey].denied++;
    }
  }

  return { lastMinute, lastHour, byClient };
}

export function clearAuditLog() {
  log = [];
}