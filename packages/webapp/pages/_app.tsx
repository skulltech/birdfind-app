import {
  ColorScheme,
  MantineProvider,
  Stack,
  useMantineTheme,
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
import { RouterTransition } from "../components/RouterTransition";
import { useColorScheme } from "@mantine/hooks";
import { useRouter } from "next/router";
import Head from "next/head";
import { GetServerSidePropsContext } from "next";
import { getCookie, setCookie } from "cookies-next";
import Script from "next/script";

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
  const theme = useMantineTheme();
  const [useSystemColorScheme, setUseSystemColorScheme] = useState<boolean>(
    props.useSystemColorScheme || true
  );

  const changeColorScheme = (value: ColorScheme | "system") => {
    if (value !== "system") {
      setUseSystemColorScheme(false);
      setCookie("birdfind-use-system-color-scheme", false, {
        maxAge: 60 * 60 * 24 * 30,
      });
      setCookie("birdfind-color-scheme", value, {
        maxAge: 60 * 60 * 24 * 30,
      });
      setColorScheme(value);
    } else setUseSystemColorScheme(true);
  };

  useEffect(() => {
    if (useSystemColorScheme) {
      setCookie("birdfind-use-system-color-scheme", true, {
        maxAge: 60 * 60 * 24 * 30,
      });
      setCookie("birdfind-color-scheme", systemColorScheme, {
        maxAge: 60 * 60 * 24 * 30,
      });
      setColorScheme(systemColorScheme);
    } else
      setCookie("birdfind-use-system-color-scheme", false, {
        maxAge: 60 * 60 * 24 * 30,
      });
  }, [systemColorScheme, useSystemColorScheme]);

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
        <title>Birdfind</title>
      </Head>
      <Script src="https://platform.twitter.com/widgets.js" />
      <GoogleAnalytics trackPageViews />
      <SessionContextProvider
        supabaseClient={supabase}
        // TODO: Add this back in
        // initialSession={pageProps.initialSession}
      >
        <MantineProvider
          theme={{
            colorScheme,
            globalStyles: (theme) => ({
              body: {
                minHeight: "100vh",
              },
              ".hover": {
                "&:hover": {
                  backgroundColor:
                    theme.colorScheme === "dark"
                      ? theme.colors.dark[4]
                      : theme.colors.gray[0],
                },
              },
            }),
          }}
          withGlobalStyles
          withNormalizeCSS
        >
          <NotificationsProvider position="top-center">
            <ModalsProvider>
              <UserProvider>
                <Stack spacing={0}>
                  <RouterTransition />
                  <AppHeader
                    width={theme.breakpoints.md}
                    colorScheme={useSystemColorScheme ? "system" : colorScheme}
                    changeColorScheme={changeColorScheme}
                  />
                  <main
                    style={{
                      paddingLeft: theme.spacing.sm,
                      paddingRight: theme.spacing.sm,
                      display: "flex",
                      justifyContent: "center",
                      minHeight: "100vh",
                    }}
                  >
                    <Component {...pageProps} width={theme.breakpoints.md} />
                  </main>
                </Stack>
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
  colorScheme: getCookie("birdfind-color-scheme", ctx),
  useSystemColorScheme: getCookie("birdfind-use-system-color-scheme", ctx),
});
