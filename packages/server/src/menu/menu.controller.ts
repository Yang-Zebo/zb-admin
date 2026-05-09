import { Controller, Get, Post, Put, Delete, Body, Param, ParseIntPipe } from '@nestjs/common'
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger'
import { MenuService } from './menu.service.js'
import { CreateMenuDto } from './dto/create-menu.dto.js'
import { UpdateMenuDto } from './dto/update-menu.dto.js'

@ApiTags('菜单管理')
@ApiBearerAuth()
@Controller('menu')
export class MenuController {
  constructor(private readonly menuService: MenuService) {}

  @Get('list')
  @ApiOperation({ summary: '获取菜单树' })
  findAll() {
    return this.menuService.findAll()
  }

  @Get('tree')
  @ApiOperation({ summary: '获取菜单树（用于角色分配权限）' })
  findTree() {
    return this.menuService.findTree()
  }

  @Get(':id')
  @ApiOperation({ summary: '查询菜单详情' })
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.menuService.findOne(id)
  }

  @Post()
  @ApiOperation({ summary: '新增菜单' })
  create(@Body() dto: CreateMenuDto) {
    return this.menuService.create(dto)
  }

  @Put(':id')
  @ApiOperation({ summary: '编辑菜单' })
  update(@Param('id', ParseIntPipe) id: number, @Body() dto: UpdateMenuDto) {
    return this.menuService.update(id, dto)
  }

  @Delete(':id')
  @ApiOperation({ summary: '删除菜单' })
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.menuService.remove(id)
  }
}
