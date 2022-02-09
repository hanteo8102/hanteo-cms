module.exports = ({ env }) => {
  if (env("NODE_ENV") === "production") {
    return {
      upload: {
        provider: "aws-s3",
        providerOptions: {
          accessKeyId: env("AWS_S3_ACCESS_KEY_ID"),
          secretAccessKey: env("AWS_S3_ACCESS_SECRET"),
          region: env("AWS_S3_REGION"),
          params: {
            Bucket: env("AWS_S3_BUCKET_NAME"),
          },
        },
      },
    };
  } else {
    return {};
  }
};
