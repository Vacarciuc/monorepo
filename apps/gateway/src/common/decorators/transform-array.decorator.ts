import { applyDecorators } from '@nestjs/common';
import { Transform } from 'class-transformer';

// Transforms the value into an array if is not of array type, ex: 1 => [1]
export const TransformArray = () =>
   applyDecorators(
      Transform(({ value }) => (Array.isArray(value) ? value : [value])),
   );
