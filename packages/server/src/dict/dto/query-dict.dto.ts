import { IsOptional, IsString, IsInt } from 'class-validator'
import { ApiPropertyOptional } from '@nestjs/swagger'
import { Type } from 'class-transformer'

export class QueryDictDto {
  @ApiPropertyOptional({ description: '页码', default: 1 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  page?: number

  @ApiPropertyOptional({ description: '每页数量', default: 10 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  pageSize?: number

  @ApiPropertyOptional({ description: '字典名称（模糊搜索）' })
  @IsOptional()
  @IsString()
  dictName?: string

  @ApiPropertyOptional({ description: '字典类型标识（模糊搜索）' })
  @IsOptional()
  @IsString()
  dictType?: string

  @ApiPropertyOptional({ description: '状态：0=停用 1=启用' })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  status?: number
}
