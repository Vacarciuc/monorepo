import { applyDecorators } from '@nestjs/common';
import { Transform } from 'class-transformer';

// Transforms the value into a boolean
export const TransformBool = () =>
   applyDecorators(Transform(({ value }) => value === 'true'));
