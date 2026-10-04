const { setServers } = require('node:dns')

function mongoConnectionUri(env = process.env) {
  if (!env.MONGO_URL) {
    throw new Error('MONGO_URL is required. Set it in .env.local or the process environment.')
  }

  const source = new URL(env.MONGO_URL)
  const seedHosts = env.MONGO_SEED_HOSTS
    ?.split(',')
    .map((host) => host.trim())
    .filter(Boolean)

  if (!seedHosts?.length) return env.MONGO_URL
  if (source.protocol !== 'mongodb+srv:') {
    throw new Error('MONGO_SEED_HOSTS can only be used with a mongodb+srv:// MONGO_URL.')
  }

  for (const host of seedHosts) {
    const match = /^([a-z0-9.-]+):(\d{1,5})$/i.exec(host)
    if (!match || Number(match[2]) < 1 || Number(match[2]) > 65535) {
      throw new Error('MONGO_SEED_HOSTS must be a comma-separated list of hostname:port values.')
    }
  }

  const options = new URLSearchParams(source.search)
  const replicaSet = env.MONGO_REPLICA_SET || options.get('replicaSet')
  if (!replicaSet) {
    throw new Error('MONGO_REPLICA_SET is required when MONGO_SEED_HOSTS is configured.')
  }
  options.set('replicaSet', replicaSet)
  if (!options.has('authSource')) options.set('authSource', 'admin')
  if (!options.has('tls') && !options.has('ssl')) options.set('tls', 'true')

  const credentials = source.username
    ? `${source.username}${source.password ? `:${source.password}` : ''}@`
    : ''
  const database = encodeURIComponent(env.DB_NAME || 'brew_edgetech')
  return `mongodb://${credentials}${seedHosts.join(',')}/${database}?${options}`
}

function configureMongoDns(env = process.env) {
  const servers = env.MONGO_DNS_SERVERS
    ?.split(',')
    .map((server) => server.trim())
    .filter(Boolean)
  if (servers?.length) setServers(servers)
}

module.exports = { configureMongoDns, mongoConnectionUri }
