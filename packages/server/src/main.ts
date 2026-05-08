import './env.js'

import { NestFactory } from '@nestjs/core'
import { ValidationPipe } from '@nestjs/common'
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger'
import { AppModule } from './app.module.js'

async function bootstrap() {
  const app = await NestFactory.create(AppModule)

  app.setGlobalPrefix('api')

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  )

  app.enableCors({
    origin: ['http://localhost:5173'],
    credentials: true,
  })

  const config = new DocumentBuilder()
    .setTitle('通用后台管理系统 API')
    .setDescription('基于 NestJS + Prisma + MySQL + Redis 的 RBAC 后台管理系统')
    .setVersion('1.0')
    .addBearerAuth()
    .build()

  const document = SwaggerModule.createDocument(app, config)
  SwaggerModule.setup('api/docs', app, document)

  await app.listen(process.env['PORT'] ?? 3000)
}
bootstrap()
