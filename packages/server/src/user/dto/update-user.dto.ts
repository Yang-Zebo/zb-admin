import { IsString, IsOptional, IsInt, IsArray, MaxLength, IsEmail } from 'class-validator'
import { ApiPropertyOptional } from '@nestjs/swagger'

export class UpdateUserDto {
  @ApiPropertyOptional({ description: '昵称', example: '张三' })
  @IsString()
  @IsOptional()
  @MaxLength(50)
  nickname?: string

  @ApiPropertyOptional({ description: '邮箱', example: 'zhangsan@example.com' })
  @IsEmail({}, { message: '邮箱格式不正确' })
  @IsOptional()
  @MaxLength(100)
  email?: string

  @ApiPropertyOptional({ description: '手机号', example: '13800138000' })
  @IsString()
  @IsOptional()
  @MaxLength(20)
  phone?: string

  @ApiPropertyOptional({ description: '性别: 0=未知 1=男 0=女', example: 1 })
  @IsInt()
  @IsOptional()
  gender?: number

  @ApiPropertyOptional({ description: '所属部门 ID', example: 1 })
  @IsInt()
  @IsOptional()
  deptId?: number

  @ApiPropertyOptional({ description: '角色 ID 列表', example: [2] })
  @IsArray()
  @IsInt({ each: true })
  @IsOptional()
  roleIds?: number[]
}
