declare namespace NodeJS {
  interface ProcessEnv {
    NEXT_PUBLIC_SUPABASE_URL: string;
    NEXT_PUBLIC_SUPABASE_ANON_KEY: string;

    SUPABASE_SERVICE_ROLE_KEY: string;

    TWITTER_BEARER_TOKEN: string;
    TWITTER_CLIENT_ID: string;
    TWITTER_CLIENT_SECRET: string;

    GOOGLE_CLIENT_ID: string;
    GOOGLE_CLIENT_SECRET: string;

    REDIS_HOST: string;
    REDIS_PORT: string;

    OPENAI_API_KEY: string;
  }
}
