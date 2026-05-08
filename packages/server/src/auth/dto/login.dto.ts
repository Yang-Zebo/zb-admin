import { IsString, IsNotEmpty, MinLength, MaxLength } from 'class-validator'
import { ApiProperty } from '@nestjs/swagger'

export class LoginDto {
  @ApiProperty({ description: '用户名', example: 'admin' })
  @IsString()
  @IsNotEmpty({ message: '用户名不能为空' })
  @MinLength(2, { message: '用户名至少2个字符' })
  @MaxLength(50, { message: '用户名最多50个字符' })
  username: string

  @ApiProperty({ description: '密码', example: 'admin123' })
  @IsString()
  @IsNotEmpty({ message: '密码不能为空' })
  @MinLength(6, { message: '密码至少6个字符' })
  @MaxLength(20, { message: '密码最多20个字符' })
  password: string

  @ApiProperty({ description: '验证码', example: '12' })
  @IsString()
  @IsNotEmpty({ message: '验证码不能为空' })
  captcha: string

  @ApiProperty({ description: '验证码唯一标识', example: 'uuid-string' })
  @IsString()
  @IsNotEmpty({ message: '验证码标识不能为空' })
  captchaId: string
}
