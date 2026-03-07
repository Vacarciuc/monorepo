import { applyDecorators } from '@nestjs/common'
import { Transform } from 'class-transformer'

export const TransformFloat = () =>
  applyDecorators(Transform(({ value }) => parseFloat(value)))
