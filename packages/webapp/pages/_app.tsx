import {
  ColorScheme,
  ColorSchemeProvider,
  MantineProvider,
  Stack,
} from "@mantine/core";
import { NotificationsProvider } from "@mantine/notifications";
import type { AppProps } from "next/app";
import { AppHeader } from "../components/AppHeader/AppHeader";
import { Session } from "@supabase/supabase-js";
import { SessionContextProvider } from "@supabase/auth-helpers-react";
import { useEffect, useState } from "react";
import { createBrowserSupabaseClient } from "@supabase/auth-helpers-nextjs";
import { ModalsProvider } from "@mantine/modals";
import { GoogleAnalytics } from "nextjs-google-analytics";
import { UserProvider } from "../providers/UserProvider";
import { JobsProvider } from "../providers/JobsProvider";
import { RouterTransition } from "../components/RouterTransition";
import { useLocalStorage } from "@mantine/hooks";
import { useRouter } from "next/router";

// Monkeypatching BigInt
BigInt.prototype["toJSON"] = function () {
  return this.toString();
};

export default function App({
  Component,
  pageProps,
}: AppProps<{
  initialSession: Session;
}>) {
  const [supabase] = useState(() => createBrowserSupabaseClient());
  const router = useRouter();
  const [colorScheme, setColorScheme] = useLocalStorage<ColorScheme>({
    key: "color-scheme",
    defaultValue: "light",
  });
  const toggleColorScheme = (value?: ColorScheme) =>
    setColorScheme(value || (colorScheme === "dark" ? "light" : "dark"));
  const horizontalPadding = 100;

  // To check if user is signed out, to bypass middleware's limitation
  useEffect(() => {
    const loadUser = async () => {
      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (!session) router.push("/auth/signin");
    };
    loadUser();
  }, [router, supabase]);

  return (
    <>
      <GoogleAnalytics trackPageViews />
      <SessionContextProvider
        supabaseClient={supabase}
        initialSession={pageProps.initialSession}
      >
        <ColorSchemeProvider
          colorScheme={colorScheme}
          toggleColorScheme={toggleColorScheme}
        >
          <MantineProvider
            theme={{ colorScheme }}
            withGlobalStyles
            withNormalizeCSS
          >
            <NotificationsProvider position="top-center">
              <ModalsProvider>
                <UserProvider>
                  <JobsProvider>
                    <Stack spacing={0}>
                      <RouterTransition />
                      <AppHeader px={horizontalPadding} py="xs" />
                      <main
                        style={{
                          paddingLeft: horizontalPadding,
                          paddingRight: horizontalPadding,
                        }}
                      >
                        <Component {...pageProps} />
                      </main>
                    </Stack>
                  </JobsProvider>
                </UserProvider>
              </ModalsProvider>
            </NotificationsProvider>
          </MantineProvider>
        </ColorSchemeProvider>
      </SessionContextProvider>
    </>
  );
}
