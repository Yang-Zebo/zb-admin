import { IsOptional, IsString, IsInt, IsIn, MaxLength } from 'class-validator'
import { ApiPropertyOptional } from '@nestjs/swagger'

export class UpdateDeptDto {
  @ApiPropertyOptional({ description: '部门名称' })
  @IsOptional()
  @IsString()
  @MaxLength(50)
  deptName?: string

  @ApiPropertyOptional({ description: '上级部门ID' })
  @IsOptional()
  @IsInt()
  parentId?: number

  @ApiPropertyOptional({ description: '排序' })
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

  @ApiPropertyOptional({ description: '状态：0=停用 1=启用' })
  @IsOptional()
  @IsInt()
  @IsIn([0, 1])
  status?: number
}
