import { SetMetadata } from '@nestjs/common';

export const IS_PUBLIC_DECORATOR_KEY = 'is_public';

// Indicates that a controller/method can be accessed unauthenticated
export const Public = () => SetMetadata(IS_PUBLIC_DECORATOR_KEY, true);
