// ===== 当前用户装饰器 =====
// 在控制器方法参数中使用 @CurrentUser() 直接获取当前登录用户信息
// 例如：@CurrentUser() user 获取完整用户对象，@CurrentUser('userId') 只获取用户 ID
// createParamDecorator：NestJS 的自定义参数装饰器工厂
import { createParamDecorator, ExecutionContext } from '@nestjs/common'

export const CurrentUser = createParamDecorator(
  (data: string | undefined, ctx: ExecutionContext) => {
    // 从 HTTP 请求中获取 user 对象（由 JwtStrategy.validate 注入）
    const request = ctx.switchToHttp().getRequest()
    const user = request.user
    // 如果传入了 data 参数（如 'userId'），只返回 user 上的对应属性
    return data ? user?.[data] : user
  },
)
