import { IsOptional, IsString, IsInt, IsIn, MaxLength } from 'class-validator'
import { ApiPropertyOptional } from '@nestjs/swagger'

export class UpdateDictDto {
  @ApiPropertyOptional({ description: '字典名称' })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  dictName?: string

  @ApiPropertyOptional({ description: '字典类型标识' })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  dictType?: string

  @ApiPropertyOptional({ description: '字典标签' })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  dictLabel?: string

  @ApiPropertyOptional({ description: '字典值' })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  dictValue?: string

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
