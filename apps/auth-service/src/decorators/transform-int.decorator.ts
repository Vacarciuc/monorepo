import { applyDecorators } from '@nestjs/common'
import { Transform } from 'class-transformer'

export const TransformInt = () =>
  applyDecorators(Transform(({ value }) => parseInt(value)))
