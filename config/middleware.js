module.exports = ({ env }) => {
  if (env('NODE_ENV') === 'production') {
    return {
      settings: {
        cors: {
          enabled: true,
          origin: env(
            'CORS_ORIGIN',
            'http://localhost:3000,http://localhost:1337'
          ).split(','),
          headers: ['*'],
        },
      },
    }
  }
  return {
    settings: {
      cors: {
        enabled: true,
        origin: ['*'],
        headers: ['*'],
      },
    },
  }
}
