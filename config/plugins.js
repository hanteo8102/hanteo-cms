module.exports = ({ env }) => {
  if (env('NODE_ENV') === 'production') {
    return {
      upload: {
        provider: 'aws-s3',
        providerOptions: {
          // accessKeyId: env('AWS_S3_ACCESS_KEY_ID'),
          // secretAccessKey: env('AWS_S3_ACCESS_SECRET'),
          // region: env('AWS_S3_REGION'),
          // params: {
          //   Bucket: env('AWS_S3_BUCKET_NAME'),
          // },
          accessKeyId: env('AKIAVKI56CKYDF2ZCH7F'),
          secretAccessKey: env('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'),
          region: env('hanteo-release'),
          params: {
            Bucket: env('ap-northeast-1'),
          },
        },
      },
    }
  } else {
    return {
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
          defaultFrom: env('EMAIL_FROM'),
          defaultReplyTo: env('EMAIL_REPLY_TO'),
          testAddress: env('EMAIL_TEST_ADDRESS'),
        },
      },
    }
  }
}
