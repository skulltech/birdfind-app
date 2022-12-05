import { AppShell, MantineProvider } from "@mantine/core";
import { NotificationsProvider } from "@mantine/notifications";
import type { AppProps } from "next/app";
import { SessionProvider, signIn, signOut, useSession } from "next-auth/react";
import { AppHeader } from "../components/AppHeader";

export default function App({
  Component,
  pageProps: { session, ...pageProps },
}: AppProps) {
  return (
    <SessionProvider session={session}>
      <MantineProvider withGlobalStyles withNormalizeCSS>
        <NotificationsProvider position="top-right">
          <AppShell
            padding="md"
            header={<AppHeader />}
            styles={(theme) => ({
              main: {
                backgroundColor:
                  theme.colorScheme === "dark"
                    ? theme.colors.dark[8]
                    : theme.colors.gray[0],
              },
            })}
          >
            <Component {...pageProps} />
          </AppShell>
        </NotificationsProvider>
      </MantineProvider>
    </SessionProvider>
  );
}
