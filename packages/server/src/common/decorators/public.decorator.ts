// ===== 公开路由装饰器 =====
// 使用 @Public() 装饰器标记不需要 JWT 认证的接口（如登录、获取验证码）
// SetMetadata 将元数据附加到路由处理器上，JwtAuthGuard 通过 Reflector 读取该元数据
import { SetMetadata } from '@nestjs/common'

export const IS_PUBLIC_KEY = 'isPublic' // 元数据 key，统一使用常量避免拼写错误
export const Public = () => SetMetadata(IS_PUBLIC_KEY, true)
