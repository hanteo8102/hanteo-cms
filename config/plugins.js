module.exports = ({ env }) => {
  return {
    upload: {
      provider: 'aws-s3',
      providerOptions: {
        accessKeyId: env('AWS_S3_ACCESS_KEY_ID'),
        secretAccessKey: env('AWS_S3_ACCESS_SECRET'),
        region: env('AWS_S3_REGION'),
        params: {
          Bucket: env('AWS_S3_BUCKET_NAME'),
        },
      },
    },
    email: {
      provider: 'gmail-api',
      providerOptions: {
        auth: {
          userId: env('EMAIL_OAUTH2_USERID'),
          clientId: env('EMAIL_OAUTH2_CLIENT_ID'),
          clientSecret: env('EMAIL_OAUTH2_CLIENT_SECRET'),
          refreshToken: env('EMAIL_OAUTH2_REFRESH_TOKEN'),
        },
      },
      settings: {
        defaultFrom: '한일생활정보 한터 <mck9191@gmail.com>',
        defaultReplyTo: '한일생활정보 한터 <mck9191@gmail.com>',
      },
    },
  }
}
