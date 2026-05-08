import { IsNotEmpty, IsOptional, IsString, IsInt, IsIn, MaxLength } from 'class-validator'
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger'

export class CreateDictDto {
  @ApiProperty({ description: '字典名称' })
  @IsNotEmpty({ message: '字典名称不能为空' })
  @IsString()
  @MaxLength(100)
  dictName: string

  @ApiProperty({ description: '字典类型标识' })
  @IsNotEmpty({ message: '字典类型标识不能为空' })
  @IsString()
  @MaxLength(100)
  dictType: string

  @ApiProperty({ description: '字典标签' })
  @IsNotEmpty({ message: '字典标签不能为空' })
  @IsString()
  @MaxLength(100)
  dictLabel: string

  @ApiProperty({ description: '字典值' })
  @IsNotEmpty({ message: '字典值不能为空' })
  @IsString()
  @MaxLength(100)
  dictValue: string

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
