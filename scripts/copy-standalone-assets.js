const fs = require('node:fs')
const path = require('node:path')

const standaloneDirectory = path.join('.next', 'standalone')

for (const [source, destination] of [
  ['public', path.join(standaloneDirectory, 'public')],
  [path.join('.next', 'static'), path.join(standaloneDirectory, '.next', 'static')],
]) {
  if (!fs.existsSync(source)) {
    throw new Error(`Required standalone build asset is missing: ${source}`)
  }

  fs.mkdirSync(path.dirname(destination), { recursive: true })
  fs.cpSync(source, destination, { recursive: true, force: true })
}
