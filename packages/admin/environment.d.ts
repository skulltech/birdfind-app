declare namespace NodeJS {
  interface ProcessEnv {
    SUPABASE_API_URL: string;
    SUPABASE_SERVICE_ROLE_KEY: string;

    TWITTER_BEARER_TOKEN: string;
    PG_CONNECTION: string;
  }
}
