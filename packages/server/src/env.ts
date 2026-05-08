import { fileURLToPath } from 'node:url'
import { dirname, resolve } from 'node:path'

process.loadEnvFile(resolve(dirname(fileURLToPath(import.meta.url)), '..', '..', '.env'))
