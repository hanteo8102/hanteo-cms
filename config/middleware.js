module.exports = ({ env }) => {
  if (env('NODE_ENV') === 'production' || env('NODE_ENV') === 'release') {
    return {
      settings: {
        cors: {
          enabled: true,
          origin: env('CORS_ORIGIN').split(','),
          headers: ['*'],
        },
      },
    }
  }
  return {
    settings: {
      cors: {
        enabled: true,
        origin: ['http://localhost:3000', 'http://localhost:1337'],
        headers: ['*'],
      },
    },
  }
}
