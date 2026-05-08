import { IsOptional, IsString, IsInt, IsIn } from 'class-validator'
import { ApiPropertyOptional } from '@nestjs/swagger'
import { Type } from 'class-transformer'

export class QueryRoleDto {
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

  @ApiPropertyOptional({ description: '角色名称（模糊搜索）' })
  @IsOptional()
  @IsString()
  roleName?: string

  @ApiPropertyOptional({ description: '角色标识（模糊搜索）' })
  @IsOptional()
  @IsString()
  roleKey?: string

  @ApiPropertyOptional({ description: '状态：0=停用 1=启用' })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @IsIn([0, 1])
  status?: number
}
