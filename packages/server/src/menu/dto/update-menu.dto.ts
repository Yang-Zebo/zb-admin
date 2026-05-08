import { IsOptional, IsString, IsInt, IsIn, MaxLength } from 'class-validator'
import { ApiPropertyOptional } from '@nestjs/swagger'

export class UpdateMenuDto {
  @ApiPropertyOptional({ description: '菜单名称' })
  @IsOptional()
  @IsString()
  @MaxLength(50)
  menuName?: string

  @ApiPropertyOptional({ description: '上级菜单ID' })
  @IsOptional()
  @IsInt()
  parentId?: number

  @ApiPropertyOptional({ description: '菜单类型：0=目录 1=菜单 2=按钮' })
  @IsOptional()
  @IsInt()
  @IsIn([0, 1, 2])
  menuType?: number

  @ApiPropertyOptional({ description: '路由路径' })
  @IsOptional()
  @IsString()
  @MaxLength(200)
  routePath?: string

  @ApiPropertyOptional({ description: '组件路径' })
  @IsOptional()
  @IsString()
  @MaxLength(200)
  componentPath?: string

  @ApiPropertyOptional({ description: '权限标识' })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  permission?: string

  @ApiPropertyOptional({ description: '图标' })
  @IsOptional()
  @IsString()
  @MaxLength(50)
  icon?: string

  @ApiPropertyOptional({ description: '排序' })
  @IsOptional()
  @IsInt()
  sort?: number

  @ApiPropertyOptional({ description: '是否可见：0=隐藏 1=显示' })
  @IsOptional()
  @IsInt()
  @IsIn([0, 1])
  isVisible?: number

  @ApiPropertyOptional({ description: '是否缓存：0=不缓存 1=缓存' })
  @IsOptional()
  @IsInt()
  @IsIn([0, 1])
  isCache?: number

  @ApiPropertyOptional({ description: '是否外链：0=否 1=是' })
  @IsOptional()
  @IsInt()
  @IsIn([0, 1])
  isExternal?: number
}
