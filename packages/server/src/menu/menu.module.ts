import { Module } from '@nestjs/common'
import { MenuService } from './menu.service.js'
import { MenuController } from './menu.controller.js'

@Module({
  controllers: [MenuController],
  providers: [MenuService],
  exports: [MenuService],
})
export class MenuModule {}
