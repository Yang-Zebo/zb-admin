import { IsNotEmpty, IsOptional, IsString, IsInt, IsIn, MaxLength } from 'class-validator'
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger'

export class CreateRoleDto {
  @ApiProperty({ description: '角色名称' })
  @IsNotEmpty({ message: '角色名称不能为空' })
  @IsString()
  @MaxLength(50)
  roleName: string

  @ApiProperty({ description: '角色标识' })
  @IsNotEmpty({ message: '角色标识不能为空' })
  @IsString()
  @MaxLength(50)
  roleKey: string

  @ApiPropertyOptional({ description: '排序', default: 0 })
  @IsOptional()
  @IsInt()
  sort?: number

  @ApiPropertyOptional({ description: '状态：0=停用 1=启用', default: 1 })
  @IsOptional()
  @IsInt()
  @IsIn([0, 1])
  status?: number
}
