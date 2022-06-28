module.exports = ({ env }) => ({
  settings: {
    cors: {
      enabled: true,
      origin: env(
        'CORS_ORIGIN',
        'http://localhost:3000,http://localhost:1337'
      ).split(','),
    },
  },
})
