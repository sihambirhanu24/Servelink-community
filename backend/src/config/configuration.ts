export default () => ({
  port: parseInt(process.env.PORT ?? '3000', 10),

  databaseUrl: process.env.DATABASE_URL,

  jwtSecret: process.env.JWT_SECRET,

  jwtExpiresIn: process.env.JWT_EXPIRES_IN,

  frontendUrl: process.env.FRONTEND_URL,

  chapaSecretKey: process.env.CHAPA_SECRET_KEY,

  chapaPublicKey: process.env.CHAPA_PUBLIC_KEY,

  chapaTestMode: process.env.CHAPA_TEST_MODE === 'true',

  livekitUrl: process.env.LIVEKIT_URL,
  livekitApiKey: process.env.LIVEKIT_API_KEY,
  livekitApiSecret: process.env.LIVEKIT_API_SECRET,
});
