// ===== 认证模块 =====
// 负责用户登录、JWT 签发与验证、权限获取
// 使用 Passport.js 作为认证中间件，JWT 策略验证请求中的 Token
import { Module } from '@nestjs/common'
import { JwtModule } from '@nestjs/jwt'
import { PassportModule } from '@nestjs/passport'
import { AuthService } from './auth.service.js'
import { AuthController } from './auth.controller.js'
import { JwtStrategy } from './strategies/jwt.strategy.js'

@Module({
  imports: [
    // PassportModule：NestJS 的认证中间件，设置默认策略为 'jwt'
    PassportModule.register({ defaultStrategy: 'jwt' }),
    // JwtModule：JWT 的签发和验证模块
    // secret：用于签名和验证 Token 的密钥
    // expiresIn：Access Token 有效期 2 小时
    JwtModule.register({
      secret: process.env['JWT_SECRET'] || 'default-secret',
      signOptions: {
        expiresIn: '2h' as const,
      },
    }),
  ],
  controllers: [AuthController],
  providers: [AuthService, JwtStrategy], // JwtStrategy 是 Passport 策略，用于验证 Token
  exports: [AuthService], // 导出 AuthService 供其他模块使用（如清除权限缓存）
})
export class AuthModule {}
