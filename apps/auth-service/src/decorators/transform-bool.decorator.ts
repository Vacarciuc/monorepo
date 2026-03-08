import { applyDecorators } from '@nestjs/common'
import { Transform } from 'class-transformer'

export const TransformBool = () =>
  applyDecorators(
    Transform(({ value }) => {
      if (typeof value === 'boolean') return value
      if (typeof value === 'string') return value === 'true'
      return !!value
    }),
  )
