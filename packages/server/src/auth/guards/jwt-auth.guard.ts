// ===== JWT 认证守卫 =====
// 作为全局守卫（在 AppModule 中通过 APP_GUARD 注册），拦截所有请求进行 JWT 认证
// 核心逻辑：
// 1. 检查路由是否被 @Public() 装饰器标记，已标记则跳过认证
// 2. 调用 Passport 的 JWT 策略验证 Token
// 3. 验证失败时返回统一的错误信息
import { Injectable, ExecutionContext, UnauthorizedException } from '@nestjs/common'
import { AuthGuard } from '@nestjs/passport' // Passport 是 NestJS 的认证中间件
import { Reflector } from '@nestjs/core' // Reflector 用于读取装饰器元数据
import { IS_PUBLIC_KEY } from '../../common/decorators/public.decorator.js'

@Injectable()
export class JwtAuthGuard extends AuthGuard('jwt') {
  // 使用 'jwt' 策略（对应 JwtStrategy）
  constructor(private reflector: Reflector) {
    super()
  }

  // canActivate：NestJS 守卫的核心方法，返回 true 放行，false 拒绝
  canActivate(context: ExecutionContext) {
    // 从当前处理器和类上读取 IS_PUBLIC_KEY 元数据
    // getAllAndOverride：同时检查方法级别和类级别的装饰器，方法级别优先
    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
      context.getHandler(), // 当前路由处理方法
      context.getClass(), // 当前控制器类
    ])
    if (isPublic) {
      return true // 标记为公开接口，直接放行
    }
    return super.canActivate(context) // 调用 Passport 的 JWT 验证流程
  }

  // handleRequest：处理认证结果，err 或 user 为 null 时表示认证失败
  handleRequest(err: any, user: any) {
    if (err || !user) {
      throw err || new UnauthorizedException('Token 无效或已过期，请重新登录')
    }
    return user // 认证成功，user 会被注入到请求对象中（可通过 @CurrentUser() 获取）
  }
}
