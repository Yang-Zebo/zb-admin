import { Controller, Get, Post, Put, Delete, Body, Param, ParseIntPipe } from '@nestjs/common'
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger'
import { DeptService } from './dept.service.js'
import { CreateDeptDto } from './dto/create-dept.dto.js'
import { UpdateDeptDto } from './dto/update-dept.dto.js'

@ApiTags('部门管理')
@ApiBearerAuth()
@Controller('dept')
export class DeptController {
  constructor(private readonly deptService: DeptService) {}

  @Get('list')
  @ApiOperation({ summary: '获取部门树' })
  findAll() {
    return this.deptService.findAll()
  }

  @Get('tree')
  @ApiOperation({ summary: '获取部门树（用于下拉选择）' })
  findTree() {
    return this.deptService.findTree()
  }

  @Get(':id')
  @ApiOperation({ summary: '查询部门详情' })
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.deptService.findOne(id)
  }

  @Post()
  @ApiOperation({ summary: '新增部门' })
  create(@Body() dto: CreateDeptDto) {
    return this.deptService.create(dto)
  }

  @Put(':id')
  @ApiOperation({ summary: '编辑部门' })
  update(@Param('id', ParseIntPipe) id: number, @Body() dto: UpdateDeptDto) {
    return this.deptService.update(id, dto)
  }

  @Delete(':id')
  @ApiOperation({ summary: '删除部门' })
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.deptService.remove(id)
  }
}
