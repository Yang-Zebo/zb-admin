import { Controller, Get, Post, Put, Delete, Body, Param, Query, ParseIntPipe } from '@nestjs/common'
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger'
import { UserService } from './user.service.js'
import { QueryUserDto } from './dto/query-user.dto.js'
import { CreateUserDto } from './dto/create-user.dto.js'
import { UpdateUserDto } from './dto/update-user.dto.js'
import { CurrentUser } from '../common/decorators/current-user.decorator.js'

@ApiTags('用户管理')
@ApiBearerAuth()
@Controller('user')
export class UserController {
  constructor(private readonly userService: UserService) {}

  @Get('list')
  @ApiOperation({ summary: '分页查询用户列表' })
  findAll(@Query() query: QueryUserDto) {
    return this.userService.findAll(query)
  }

  @Get(':id')
  @ApiOperation({ summary: '查询单个用户详情' })
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.userService.findOne(id)
  }

  @Post()
  @ApiOperation({ summary: '新增用户' })
  create(@Body() dto: CreateUserDto) {
    return this.userService.create(dto)
  }

  @Put(':id')
  @ApiOperation({ summary: '编辑用户' })
  update(@Param('id', ParseIntPipe) id: number, @Body() dto: UpdateUserDto) {
    return this.userService.update(id, dto)
  }

  @Delete(':id')
  @ApiOperation({ summary: '删除用户' })
  remove(@Param('id', ParseIntPipe) id: number, @CurrentUser('userId') currentUserId: number) {
    return this.userService.remove(id, currentUserId)
  }

  @Post('batch-delete')
  @ApiOperation({ summary: '批量删除用户' })
  removeBatch(@Body('ids') ids: number[], @CurrentUser('userId') currentUserId: number) {
    return this.userService.removeBatch(ids, currentUserId)
  }

  @Put(':id/reset-password')
  @ApiOperation({ summary: '重置用户密码' })
  resetPassword(@Param('id', ParseIntPipe) id: number) {
    return this.userService.resetPassword(id)
  }

  @Put(':id/toggle-status')
  @ApiOperation({ summary: '启用/停用用户' })
  toggleStatus(@Param('id', ParseIntPipe) id: number) {
    return this.userService.toggleStatus(id)
  }
}
