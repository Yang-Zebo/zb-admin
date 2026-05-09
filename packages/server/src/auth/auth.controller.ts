import { Controller, Post, Get, Body, Headers } from '@nestjs/common'
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger'
import { AuthService } from './auth.service.js'
import { LoginDto } from './dto/login.dto.js'
import { Public } from '../common/decorators/public.decorator.js'
import { CurrentUser } from '../common/decorators/current-user.decorator.js'

@ApiTags('认证与授权')
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Public()
  @Get('captcha')
  @ApiOperation({ summary: '获取图形验证码' })
  generateCaptcha() {
    return this.authService.generateCaptcha()
  }

  @Public()
  @Post('login')
  @ApiOperation({ summary: '用户登录' })
  login(@Body() dto: LoginDto) {
    return this.authService.login(dto)
  }

  @Post('logout')
  @ApiOperation({ summary: '退出登录' })
  @ApiBearerAuth()
  logout(@CurrentUser() user: any, @Headers('authorization') auth: string) {
    const token = auth?.replace('Bearer ', '') || ''
    return this.authService.logout(user.userId, token)
  }

  @Public()
  @Post('refresh')
  @ApiOperation({ summary: '刷新 Token' })
  refresh(@Body('refreshToken') refreshToken: string) {
    return this.authService.refreshToken(refreshToken)
  }

  @Get('permissions')
  @ApiOperation({ summary: '获取当前用户权限和菜单' })
  @ApiBearerAuth()
  getPermissions(@CurrentUser() user: any) {
    return this.authService.getPermissions(user.userId)
  }
}
