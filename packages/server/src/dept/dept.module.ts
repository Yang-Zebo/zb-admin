import { Module } from '@nestjs/common'
import { DeptService } from './dept.service.js'
import { DeptController } from './dept.controller.js'

@Module({
  controllers: [DeptController],
  providers: [DeptService],
  exports: [DeptService],
})
export class DeptModule {}
