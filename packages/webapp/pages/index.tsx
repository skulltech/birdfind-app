import { Center, Container, Text } from "@mantine/core";
import Head from "next/head";

const Home = () => {
  return (
    <>
      <Head>
        <title>Home | Birdfind</title>
      </Head>
      <Container mt={100}>
        <Center>
          <Text>Welcome to Birdfind</Text>
        </Center>
      </Container>
    </>
  );
};

export default Home;
