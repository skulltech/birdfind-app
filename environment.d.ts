declare namespace NodeJS {
  interface ProcessEnv {
    NEXT_PUBLIC_SUPABASE_URL: string;
    NEXT_PUBLIC_SUPABASE_ANON_KEY: string;
    TWITTER_BEARER_TOKEN: string;
    SUPABASE_SERVICE_ROLE_KEY: string;
  }
}
