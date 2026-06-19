const MAX_ENTRIES = 500;
const log = [];

export function addAuditEntry(entry) {
  log.unshift({ ...entry, timestamp: Date.now() });
  if (log.length > MAX_ENTRIES) log.pop();
}

export function getAuditLog({ limit = 50, apiKey, allowed } = {}) {
  let results = log;
  if (apiKey) results = results.filter(e => e.apiKey === apiKey);
  if (allowed !== undefined) results = results.filter(e => e.allowed === allowed);
  return results.slice(0, limit);
}

export function getStats() {
  const now = Date.now();
  const lastMinute = log.filter(e => now - e.timestamp < 60000);
  const lastHour = log.filter(e => now - e.timestamp < 3600000);

  return {
    lastMinute: {
      total: lastMinute.length,
      allowed: lastMinute.filter(e => e.allowed).length,
      denied: lastMinute.filter(e => !e.allowed).length,
    },
    lastHour: {
      total: lastHour.length,
      allowed: lastHour.filter(e => e.allowed).length,
      denied: lastHour.filter(e => !e.allowed).length,
    },
    byClient: groupByClient(lastMinute),
  };
}

function groupByClient(entries) {
  const map = {};
  for (const e of entries) {
    if (!map[e.apiKey]) map[e.apiKey] = { total: 0, allowed: 0, denied: 0 };
    map[e.apiKey].total++;
    if (e.allowed) map[e.apiKey].allowed++;
    else map[e.apiKey].denied++;
  }
  return map;
}

export function clearAuditLog() {
  log.length = 0;
}