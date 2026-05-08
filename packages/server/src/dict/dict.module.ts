import { Module } from '@nestjs/common'
import { DictService } from './dict.service.js'
import { DictController } from './dict.controller.js'

@Module({
  controllers: [DictController],
  providers: [DictService],
  exports: [DictService],
})
export class DictModule {}
