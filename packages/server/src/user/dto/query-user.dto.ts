import { IsOptional, IsInt, IsString, Min } from 'class-validator'
import { Type } from 'class-transformer'
import { ApiPropertyOptional } from '@nestjs/swagger'

export class QueryUserDto {
  @ApiPropertyOptional({ description: '页码', example: 1 })
  @Type(() => Number)
  @IsInt()
  @IsOptional()
  @Min(1)
  page?: number = 1

  @ApiPropertyOptional({ description: '每页条数', example: 10 })
  @Type(() => Number)
  @IsInt()
  @IsOptional()
  @Min(1)
  pageSize?: number = 10

  @ApiPropertyOptional({ description: '用户名（模糊搜索）', example: 'admin' })
  @IsString()
  @IsOptional()
  username?: string

  @ApiPropertyOptional({ description: '手机号（模糊搜索）', example: '138' })
  @IsString()
  @IsOptional()
  phone?: string

  @ApiPropertyOptional({ description: '状态: 1=启用 0=停用', example: 1 })
  @Type(() => Number)
  @IsInt()
  @IsOptional()
  status?: number

  @ApiPropertyOptional({ description: '部门 ID', example: 1 })
  @Type(() => Number)
  @IsInt()
  @IsOptional()
  deptId?: number
}
