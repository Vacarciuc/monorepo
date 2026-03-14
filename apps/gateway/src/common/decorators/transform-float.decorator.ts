import { applyDecorators } from '@nestjs/common';
import { Transform } from 'class-transformer';

// Transforms the value into a float
export const TransformFloat = () =>
   applyDecorators(Transform(({ value }) => parseFloat(value)));
