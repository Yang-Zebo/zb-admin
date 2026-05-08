import { IsNotEmpty, IsOptional, IsString, IsInt, IsIn, MaxLength } from 'class-validator'
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger'

export class CreateDeptDto {
  @ApiProperty({ description: '部门名称' })
  @IsNotEmpty({ message: '部门名称不能为空' })
  @IsString()
  @MaxLength(50)
  deptName: string

  @ApiPropertyOptional({ description: '上级部门ID', default: 0 })
  @IsOptional()
  @IsInt()
  parentId?: number

  @ApiPropertyOptional({ description: '排序', default: 0 })
  @IsOptional()
  @IsInt()
  sort?: number

  @ApiPropertyOptional({ description: '负责人' })
  @IsOptional()
  @IsString()
  @MaxLength(50)
  leader?: string

  @ApiPropertyOptional({ description: '联系电话' })
  @IsOptional()
  @IsString()
  @MaxLength(20)
  phone?: string

  @ApiPropertyOptional({ description: '状态：0=停用 1=启用', default: 1 })
  @IsOptional()
  @IsInt()
  @IsIn([0, 1])
  status?: number
}
