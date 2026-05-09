// ===== 环境变量加载 =====
// 在应用启动最早期加载 .env 文件，确保后续所有模块都能读取到环境变量
// 使用 Node.js 原生的 process.loadEnvFile 替代第三方 dotenv 包，减少依赖
import { fileURLToPath } from 'node:url'
import { dirname, resolve } from 'node:path'

// fileURLToPath：将 ESM 的 import.meta.url 转为文件系统路径
// dirname：获取当前文件所在目录
// resolve：向上两级找到项目根目录下的 .env 文件
process.loadEnvFile(resolve(dirname(fileURLToPath(import.meta.url)), '..', '..', '.env'))
