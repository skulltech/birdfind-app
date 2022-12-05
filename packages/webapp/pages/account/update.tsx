import { Button, Container, Paper, Stack, Text } from "@mantine/core";
import { signIn, useSession } from "next-auth/react";

const Update = () => {
  const { data: session } = useSession();
  const twitterUsername = session.twitter.profile.username;

  return (
    <Container size="xs" p="xl" mt={100}>
      <Paper withBorder p="lg">
        <Stack>
          {twitterUsername ? (
            <Text>Connected to Twitter @{twitterUsername}</Text>
          ) : (
            <Button onClick={() => signIn("twitter")}>Connect Twitter</Button>
          )}
        </Stack>
      </Paper>
    </Container>
  );
};

export default Update;
