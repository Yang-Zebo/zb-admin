// ===== 先加载 .env 环境变量，确保后续代码能读取到配置 =====
import './env.js'

import { NestFactory } from '@nestjs/core'
import { ValidationPipe } from '@nestjs/common'
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger'
import { AppModule } from './app.module.js'

// 【NestJS 应用入口函数】bootstrap() 是 NestJS 应用的启动引导函数
// 负责创建应用实例、配置全局管道/跨域/API文档，然后监听端口启动服务
async function bootstrap() {
  // 创建 NestJS 应用实例，传入根模块 AppModule
  // NestFactory 是 NestJS 的工厂类，用于创建 HTTP 服务器实例
  const app = await NestFactory.create(AppModule)

  // 设置全局路由前缀为 'api'，所有接口路径都会加上 /api 前缀
  // 例如：/auth/login 实际访问路径为 /api/auth/login
  app.setGlobalPrefix('api')

  // 【全局参数验证管道】ValidationPipe 用于自动校验请求参数
  // whitelist: true —— 自动剔除 DTO 中未定义的属性（安全防护）
  // forbidNonWhitelisted: true —— 如果传入了未定义的属性，直接报错
  // transform: true —— 自动将请求参数转换为 DTO 中定义的类型（如字符串转数字）
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  )

  // 启用 CORS 跨域支持，允许前端开发服务器 (Vite 默认 5173 端口) 访问后端 API
  app.enableCors({
    origin: ['http://localhost:5173'],
    credentials: true, // 允许携带 Cookie 和认证信息
  })

  // 【Swagger API 文档配置】自动生成可交互的 API 文档页面
  // 访问地址：http://localhost:3000/api/docs
  const config = new DocumentBuilder()
    .setTitle('通用后台管理系统 API')
    .setDescription('基于 NestJS + Prisma + MySQL + Redis 的 RBAC 后台管理系统')
    .setVersion('1.0')
    .addBearerAuth() // 添加 Bearer Token 认证方式（JWT）
    .build()

  const document = SwaggerModule.createDocument(app, config)
  SwaggerModule.setup('api/docs', app, document) // 在 /api/docs 路径挂载文档页面

  // 启动 HTTP 服务器，监听指定端口（默认 3000）
  await app.listen(process.env['PORT'] ?? 3000)
}
bootstrap()
