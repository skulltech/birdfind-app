declare namespace NodeJS {
  interface ProcessEnv {
    SUPABASE_API_URL: string;
    SUPABASE_SERVICE_ROLE_KEY: string;

    REDIS_HOST: string;
    REDIS_PORT: string;
    REDIS_PASSWORD: string;

    TWITTER_BEARER_TOKEN: string;
  }
}
