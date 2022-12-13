declare namespace NodeJS {
  interface ProcessEnv {
    SUPABASE_API_URL: string;
    SUPABASE_SERVICE_ROLE_KEY: string;

    REDIS_HOST: string;
    REDIS_PORT: string;

    TWITTER_CLIENT_ID: string;
    TWITTER_CLIENT_SECRET: string;
  }
}
