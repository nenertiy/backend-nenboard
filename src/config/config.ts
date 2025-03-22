export default () => ({
  PORT: parseInt(process.env.PORT) || 3000,
  ACCESS_TOKEN: process.env.ACCESS_TOKEN,
  REFRESH_TOKEN: process.env.REFRESH_TOKEN,

  REDIS_URL: process.env.REDIS_URL,

  S3_ACCESS_KEY: process.env.S3_ACCESS_KEY,
  S3_SECRET_KEY: process.env.S3_SECRET_KEY,
  S3_REGION: process.env.S3_REGION,
  S3_BUCKET_NAME: process.env.S3_BUCKET_NAME,
  S3_ENDPOINT: process.env.S3_ENDPOINT,
});
