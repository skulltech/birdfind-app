import { MantineProvider } from "@mantine/core";
import { NotificationsProvider } from "@mantine/notifications";
import type { AppProps } from "next/app";
import { SessionProvider } from "next-auth/react";

export default function App({
  Component,
  pageProps: { session, ...pageProps },
}: AppProps) {
  return (
    <SessionProvider session={session}>
      <MantineProvider withGlobalStyles withNormalizeCSS>
        <NotificationsProvider position="top-right">
          <Component {...pageProps} />;
        </NotificationsProvider>
      </MantineProvider>
    </SessionProvider>
  );
}
