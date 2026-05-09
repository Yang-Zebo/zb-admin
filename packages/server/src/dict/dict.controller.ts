import { Controller, Get, Post, Put, Delete, Body, Param, Query, ParseIntPipe } from '@nestjs/common'
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger'
import { DictService } from './dict.service.js'
import { CreateDictDto } from './dto/create-dict.dto.js'
import { UpdateDictDto } from './dto/update-dict.dto.js'
import { QueryDictDto } from './dto/query-dict.dto.js'

@ApiTags('字典管理')
@ApiBearerAuth()
@Controller('dict')
export class DictController {
  constructor(private readonly dictService: DictService) {}

  @Get('list')
  @ApiOperation({ summary: '分页查询字典列表' })
  findAll(@Query() query: QueryDictDto) {
    return this.dictService.findAll(query)
  }

  @Get('types')
  @ApiOperation({ summary: '获取所有字典类型（去重）' })
  findAllTypes() {
    return this.dictService.findAllTypes()
  }

  @Get('type/:dictType')
  @ApiOperation({ summary: '根据字典类型查询字典数据' })
  findByType(@Param('dictType') dictType: string) {
    return this.dictService.findByType(dictType)
  }

  @Get(':id')
  @ApiOperation({ summary: '查询字典详情' })
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.dictService.findOne(id)
  }

  @Post()
  @ApiOperation({ summary: '新增字典' })
  create(@Body() dto: CreateDictDto) {
    return this.dictService.create(dto)
  }

  @Put(':id')
  @ApiOperation({ summary: '编辑字典' })
  update(@Param('id', ParseIntPipe) id: number, @Body() dto: UpdateDictDto) {
    return this.dictService.update(id, dto)
  }

  @Delete(':id')
  @ApiOperation({ summary: '删除字典' })
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.dictService.remove(id)
  }
}
