import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  Query,
  ParseIntPipe,
} from '@nestjs/common'
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger'
import { RoleService } from './role.service.js'
import { CreateRoleDto } from './dto/create-role.dto.js'
import { UpdateRoleDto } from './dto/update-role.dto.js'
import { QueryRoleDto } from './dto/query-role.dto.js'

@ApiTags('角色管理')
@ApiBearerAuth()
@Controller('role')
export class RoleController {
  constructor(private readonly roleService: RoleService) {}

  @Get('list')
  @ApiOperation({ summary: '分页查询角色列表' })
  findAll(@Query() query: QueryRoleDto) {
    return this.roleService.findAll(query)
  }

  @Get('all')
  @ApiOperation({ summary: '查询所有角色（下拉选择用）' })
  findAllSimple() {
    return this.roleService.findAllSimple()
  }

  @Get(':id')
  @ApiOperation({ summary: '查询角色详情（含菜单权限ID列表）' })
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.roleService.findOne(id)
  }

  @Post()
  @ApiOperation({ summary: '新增角色' })
  create(@Body() dto: CreateRoleDto) {
    return this.roleService.create(dto)
  }

  @Put(':id')
  @ApiOperation({ summary: '编辑角色' })
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateRoleDto,
  ) {
    return this.roleService.update(id, dto)
  }

  @Delete(':id')
  @ApiOperation({ summary: '删除角色' })
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.roleService.remove(id)
  }

  @Put(':id/menus')
  @ApiOperation({ summary: '分配菜单权限' })
  assignMenus(
    @Param('id', ParseIntPipe) id: number,
    @Body('menuIds') menuIds: number[],
  ) {
    return this.roleService.assignMenus(id, menuIds)
  }
}
