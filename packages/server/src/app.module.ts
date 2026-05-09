// ===== NestJS 根模块 =====
// AppModule 是整个应用的入口模块，负责：
// 1. 注册所有子模块（用户、角色、菜单、部门、字典、日志）
// 2. 配置全局守卫（JWT 认证）和全局拦截器（操作日志）
// 3. 加载环境变量配置文件
import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { APP_GUARD, APP_INTERCEPTOR } from '@nestjs/core';
import { AppController } from './app.controller.js';
import { AppService } from './app.service.js';
import { PrismaModule } from './prisma/prisma.module.js';
import { RedisModule } from './redis/redis.module.js';
import { AuthModule } from './auth/auth.module.js';
import { UserModule } from './user/user.module.js';
import { MenuModule } from './menu/menu.module.js';
import { RoleModule } from './role/role.module.js';
import { DeptModule } from './dept/dept.module.js';
import { LogModule } from './log/log.module.js';
import { DictModule } from './dict/dict.module.js';
import { LogInterceptor } from './log/log.interceptor.js';
import { JwtAuthGuard } from './auth/guards/jwt-auth.guard.js';

@Module({
  imports: [
    // ConfigModule：加载 .env 配置文件，isGlobal: true 表示全局可用
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
    }),
    // PrismaModule 和 RedisModule 用 @Global() 装饰，全局可用，无需在各模块重复导入
    PrismaModule,
    RedisModule,
    // 各业务模块——NestJS 的模块化架构，每个模块独立管理自己的控制器和服务
    AuthModule,
    UserModule,
    MenuModule,
    RoleModule,
    DeptModule,
    LogModule,
    DictModule,
  ],
  controllers: [AppController],
  providers: [
    AppService,
    // 【全局 JWT 认证守卫】APP_GUARD 是 NestJS 的常量标记
    // 使用 JwtAuthGuard 作为全局守卫，所有接口默认需要 JWT 认证
    // 通过 @Public() 装饰器可以标记不需要认证的接口（如登录、获取验证码）
    {
      provide: APP_GUARD,
      useClass: JwtAuthGuard,
    },
    // 【全局操作日志拦截器】自动记录每个接口的调用日志
    // 使用 RxJS 的 tap 操作符在请求完成后异步写入日志
    {
      provide: APP_INTERCEPTOR,
      useClass: LogInterceptor,
    },
  ],
})
export class AppModule {}
