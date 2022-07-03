module.exports = ({ env }) => ({
  host: env('HOST', '0.0.0.0'),
  port: env.int('PORT', 1337),
  url: env('SERVER_URL'),
  admin: {
    url: env('ADMIN_URL'),
    auth: {
      secret: env('ADMIN_JWT_SECRET', '4f120c167a62817338b16b580a61b44b'),
    },
  },
})
