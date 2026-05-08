import { Module } from '@nestjs/common'
import { LogService } from './log.service.js'
import { LogController } from './log.controller.js'
import { LogInterceptor } from './log.interceptor.js'

@Module({
  controllers: [LogController],
  providers: [LogService, LogInterceptor],
  exports: [LogService, LogInterceptor],
})
export class LogModule {}
