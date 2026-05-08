import { IsOptional, IsString, IsInt } from 'class-validator'
import { ApiPropertyOptional } from '@nestjs/swagger'

export class CreateLogDto {
  @ApiPropertyOptional({ description: '用户 ID' })
  @IsOptional()
  @IsInt()
  userId?: number

  @ApiPropertyOptional({ description: 'IP 地址' })
  @IsOptional()
  @IsString()
  ip?: string

  @ApiPropertyOptional({ description: '操作类型' })
  @IsOptional()
  @IsString()
  actionType?: string

  @ApiPropertyOptional({ description: '操作模块' })
  @IsOptional()
  @IsString()
  module?: string

  @ApiPropertyOptional({ description: '操作描述' })
  @IsOptional()
  @IsString()
  description?: string

  @ApiPropertyOptional({ description: '请求参数 JSON' })
  @IsOptional()
  @IsString()
  requestParams?: string

  @ApiPropertyOptional({ description: '返回结果 JSON' })
  @IsOptional()
  @IsString()
  responseResult?: string

  @ApiPropertyOptional({ description: '耗时（ms）' })
  @IsOptional()
  @IsInt()
  duration?: number
}
