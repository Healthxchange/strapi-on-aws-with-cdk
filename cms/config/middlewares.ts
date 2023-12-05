const middlewares = ({ env }) => {
  const s3Bucket = `${env('S3_BUCKET', undefined)}.s3.eu-west-1.amazonaws.com`

  return [
    'strapi::errors',
    {
      name: 'strapi::security',
      config: {
        contentSecurityPolicy: {
          useDefaults: true,
          directives: {
            'connect-src': ["'self'", 'https:'],
            'img-src': ["'self'", 'data:', 'blob:', 'market-assets.strapi.io', s3Bucket],
            'media-src': ["'self'", 'data:', 'blob:', 'market-assets.strapi.io', s3Bucket],
            upgradeInsecureRequests: null,
          },
        },
      },
    },
    'strapi::cors',
    'strapi::poweredBy',
    'strapi::logger',
    'strapi::query',
    'strapi::body',
    'strapi::session',
    'strapi::favicon',
    'strapi::public',
  ]
}

export default middlewares
