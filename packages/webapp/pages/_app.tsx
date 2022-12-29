import {
  ColorScheme,
  ColorSchemeProvider,
  MantineProvider,
  Stack,
} from "@mantine/core";
import { NotificationsProvider } from "@mantine/notifications";
import type { AppProps } from "next/app";
import { AppHeader } from "../components/AppHeader";
import { Session } from "@supabase/supabase-js";
import { SessionContextProvider } from "@supabase/auth-helpers-react";
import { useState } from "react";
import { createBrowserSupabaseClient } from "@supabase/auth-helpers-nextjs";
import { TwipsProvider } from "../components/TwipsProvider";
import { ModalsProvider } from "@mantine/modals";
import { GoogleAnalytics } from "nextjs-google-analytics";

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
  const [colorScheme, setColorScheme] = useState<ColorScheme>("light");
  const toggleColorScheme = (value?: ColorScheme) =>
    setColorScheme(value || (colorScheme === "dark" ? "light" : "dark"));
  const horizontalPadding = 100;

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
                <TwipsProvider supabase={supabase}>
                  <Stack>
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
                </TwipsProvider>
              </ModalsProvider>
            </NotificationsProvider>
          </MantineProvider>
        </ColorSchemeProvider>
      </SessionContextProvider>
    </>
  );
}
