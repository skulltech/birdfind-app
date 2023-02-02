declare namespace NodeJS {
  interface ProcessEnv {
    SUPABASE_API_URL: string;
    SUPABASE_SERVICE_ROLE_KEY: string;

    PG_CONNECTION: string;

    REDIS_HOST: string;
    REDIS_PORT: string;
    REDIS_PASSWORD: string;

    TWITTER_CLIENT_ID: string;
    TWITTER_CLIENT_SECRET: string;

    TELEGRAM_API_KEY: string;
    TELEGRAM_CHAT_ID: string;

    OPENAI_API_KEY: string;
  }
}
