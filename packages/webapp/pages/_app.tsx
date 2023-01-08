import { ColorScheme, MantineProvider, Stack } from "@mantine/core";
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
import { useColorScheme } from "@mantine/hooks";
import { useRouter } from "next/router";
import Head from "next/head";
import { GetServerSidePropsContext } from "next";
import { getCookie, setCookie } from "cookies-next";

// Monkeypatching types for JSON serialization
BigInt.prototype["toJSON"] = function () {
  return this.toString();
};
Set.prototype["toJSON"] = function () {
  return Array.from(this);
};
Date.prototype["toJSON"] = function () {
  return this.toISOString();
};

export default function App({
  Component,
  pageProps,
  ...props
}: AppProps<{
  initialSession: Session;
}> & { colorScheme: ColorScheme; useSystemColorScheme: boolean }) {
  const [supabase] = useState(() => createBrowserSupabaseClient());
  const router = useRouter();

  // Color scheme related logic
  const systemColorScheme = useColorScheme();
  const [colorScheme, setColorScheme] = useState<ColorScheme>(
    props.colorScheme
  );
  const [useSystemColorScheme, setUseSystemColorScheme] = useState<boolean>(
    props.useSystemColorScheme || true
  );

  const changeColorScheme = (value: ColorScheme | "system") => {
    if (value !== "system") {
      setUseSystemColorScheme(false);
      setCookie("twips-use-system-color-scheme", false, {
        maxAge: 60 * 60 * 24 * 30,
      });
      setCookie("twips-color-scheme", value, {
        maxAge: 60 * 60 * 24 * 30,
      });
      setColorScheme(value);
    } else setUseSystemColorScheme(true);
  };

  useEffect(() => {
    if (useSystemColorScheme) {
      setCookie("twips-use-system-color-scheme", true, {
        maxAge: 60 * 60 * 24 * 30,
      });
      setCookie("twips-color-scheme", systemColorScheme, {
        maxAge: 60 * 60 * 24 * 30,
      });
      setColorScheme(systemColorScheme);
    } else
      setCookie("twips-use-system-color-scheme", false, {
        maxAge: 60 * 60 * 24 * 30,
      });
  }, [systemColorScheme, useSystemColorScheme]);

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
  }, []);

  return (
    <>
      <Head>
        <link rel="shortcut icon" href="/images/icons8-twitter-64.png" />
        <title>Twips: Search for Tweeps!</title>
      </Head>
      <GoogleAnalytics trackPageViews />
      <SessionContextProvider
        supabaseClient={supabase}
        // TODO: Add this back in
        // initialSession={pageProps.initialSession}
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
                    <AppHeader
                      px={horizontalPadding}
                      py="xs"
                      colorScheme={
                        useSystemColorScheme ? "system" : colorScheme
                      }
                      changeColorScheme={changeColorScheme}
                    />
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
      </SessionContextProvider>
    </>
  );
}

App.getInitialProps = ({ ctx }: { ctx: GetServerSidePropsContext }) => ({
  // get color scheme settings from cookie
  colorScheme: getCookie("twips-color-scheme", ctx),
  useSystemColorScheme: getCookie("twips-use-system-color-scheme", ctx),
});
