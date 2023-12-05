const plugins = ({ env }) => ({
  upload: {
    config: {
      provider: 'aws-s3',
      providerOptions: {
        s3Options: {
          accessKeyId: env('ACCESS_KEY_ID'),
          secretAccessKey: env('SECRET_ACCESS_KEY'),
          region: 'eu-west-1',
          params: {
            Bucket: env('S3_BUCKET'),
          },
        },
      },
    },
  },
})

export default plugins
