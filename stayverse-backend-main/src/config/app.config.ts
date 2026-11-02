export default () => ({
  app: {
    name: process.env.APP_NAME || "stayverse",
    base_url: process.env.BASE_URL || "http://localhost:3000",
    port: parseInt(process.env.PORT, 10) || 3000,
    env: process.env.NODE_ENV || "development",
  },
  mail: {
    host: process.env.MAIL_HOST || "smtp.mailtrap.io",
    port: parseInt(process.env.MAIL_PORT, 10) || 2525,
    user: process.env.MAIL_USER || "your_mailtrap_user",
    pass: process.env.MAIL_PASS || "your_mailtrap_pass",
    from: process.env.MAIL_FROM || "no-reply@example.com",
    timeoutMs: parseInt(process.env.MAIL_TIMEOUT_MS, 10) || 15000,
    brevoApiKey: process.env.BREVO_API_KEY || "",
    resendApiKey: process.env.RESEND_API_KEY || "",
    logOtpFallback: process.env.MAIL_LOG_OTP_FALLBACK !== 'false',
  },

  database: {
    url: process.env.DATABASE_URL || "stay-verse-database-url",
  },
  jwt: {
    secret: process.env.JWT_SECRET || "supersecretkey",
    expiresIn: process.env.JWT_EXPIRES_IN || "30d",
  },
  googleMaps: {
    apiKey: process.env.GOOGLE_MAPS_API_KEY || "your_google_maps_api_key",
  },
  redis: {
    username: process.env.REDIS_USERNAME || "default",
    password: process.env.REDIS_PASSWORD || "default_password",
    host: process.env.REDIS_HOST || "",
    port: parseInt(process.env.REDIS_PORT, 10) || 6379,
  },
  stream: {
    apiKey: process.env.STREAM_API_KEY || "your_stream_api_key",
    apiSecret: process.env.STREAM_API_SECRET || "your_stream_api_secret",
  },
  paystack: {
    secretKey: process.env.PAYSTACK_SECRET_KEY || "your-paystack_secret_key",
    publicKey: process.env.PAYSTACK_PUBLIC_KEY || "your_paystack_public_key",
    callbackUrl: process.env.PAYSTACK_CALLBACK_URL || "your_paystack_callback_url",
  },
  dojah: {
    apiKey: process.env.DOJAH_APP_ID || "your_dojah_app_id",
    secretKey: process.env.DOJAH_SECRET_KEY || "your_dojah_secret_key",
    publicKey: process.env.DOJAH_PUBLIC_KEY || "your_dojah_public_key",
    baseUrl: process.env.DOJAH_BASE_URL || "https://api.dojah.io",
  },
  storage: {
    provider: process.env.STORAGE_PROVIDER || 'digitalocean',
    supabaseUrl: process.env.SUPABASE_URL || '',
    s3Endpoint: process.env.SUPABASE_S3_ENDPOINT || '',
    region: process.env.SUPABASE_S3_REGION || '',
    bucket: process.env.SUPABASE_STORAGE_BUCKET || 'stayverse-media',
    accessKeyId: process.env.SUPABASE_S3_ACCESS_KEY_ID || '',
    secretAccessKey: process.env.SUPABASE_S3_SECRET_ACCESS_KEY || '',
  },
  do: {
    region: process.env.DO_REGION || "nyc3",
    bucket: process.env.DO_BUCKET || "your_do_bucket",
    accessKey: process.env.DO_ACCESS_KEY || "your_do_access_key",
    secretKey: process.env.DO_SECRET_KEY || "your_do_secret_key",
    cdnUrl: process.env.DO_CDN_URL || "https://your_cdn_url",
  },
  betterStack: {
    sourceToken: process.env.BETTER_STACK_SOURCE_TOKEN || ""
  },
});
