import {
  ServeStaticModuleAsyncOptions,
  ServeStaticModuleOptions,
} from '@nestjs/serve-static'
import path from 'path'

export const SERVE_STATIC_CONFIG: ServeStaticModuleAsyncOptions = {
  useFactory: () => {
    const sharedProps: Partial<ServeStaticModuleOptions> = {
      useGlobalPrefix: false,
      serveStaticOptions: {
        etag: true,
        cacheControl: true,
        dotfiles: 'ignore',
        lastModified: true,
        maxAge: '12h',
      },
    }

    return [
      {
        rootPath: path.join(__dirname, 'assets'),
        serveRoot: '/assets',
        ...sharedProps,
      },
    ]
  },
}
