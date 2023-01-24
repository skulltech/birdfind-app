import { Center, Text } from "@mantine/core";
import Head from "next/head";

const MobileNotSupported = () => {
  return (
    <>
      <Head>
        <title>Unsupported Device | Birdfind</title>
      </Head>
      <Center p="lg">
        <Text>
          Mobile browsers are not supported, please access Birdfind from a
          desktop browser.
        </Text>
      </Center>
    </>
  );
};

export default MobileNotSupported;
