import { IsOptional, IsString, IsInt, IsIn, MaxLength } from 'class-validator'
import { ApiPropertyOptional } from '@nestjs/swagger'

export class UpdateRoleDto {
  @ApiPropertyOptional({ description: '角色名称' })
  @IsOptional()
  @IsString()
  @MaxLength(50)
  roleName?: string

  @ApiPropertyOptional({ description: '角色标识' })
  @IsOptional()
  @IsString()
  @MaxLength(50)
  roleKey?: string

  @ApiPropertyOptional({ description: '排序' })
  @IsOptional()
  @IsInt()
  sort?: number

  @ApiPropertyOptional({ description: '状态：0=停用 1=启用' })
  @IsOptional()
  @IsInt()
  @IsIn([0, 1])
  status?: number
}
