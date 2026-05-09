import { Controller, Get, Query } from '@nestjs/common'
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger'
import { LogService } from './log.service.js'
import { QueryLogDto } from './dto/query-log.dto.js'

@ApiTags('操作日志')
@ApiBearerAuth()
@Controller('log')
export class LogController {
  constructor(private readonly logService: LogService) {}

  @Get('list')
  @ApiOperation({ summary: '分页查询操作日志' })
  findAll(@Query() query: QueryLogDto) {
    return this.logService.findAll(query)
  }
}
