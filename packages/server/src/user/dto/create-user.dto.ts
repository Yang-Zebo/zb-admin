import { IsString, IsNotEmpty, IsOptional, IsInt, IsArray, MinLength, MaxLength, IsEmail } from 'class-validator'
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger'

export class CreateUserDto {
  @ApiProperty({ description: '用户名', example: 'zhangsan' })
  @IsString()
  @IsNotEmpty({ message: '用户名不能为空' })
  @MinLength(2, { message: '用户名至少2个字符' })
  @MaxLength(50, { message: '用户名最多50个字符' })
  username: string

  @ApiProperty({ description: '密码', example: '123456' })
  @IsString()
  @IsNotEmpty({ message: '密码不能为空' })
  @MinLength(6, { message: '密码至少6个字符' })
  @MaxLength(20, { message: '密码最多20个字符' })
  password: string

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
