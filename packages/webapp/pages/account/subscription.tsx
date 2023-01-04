import { Anchor, Container, Group, Stack, Text } from "@mantine/core";
import { AccountNavbar } from "../../components/AccountNavbar";

const Subscription = () => {
  return (
    <Group>
      <AccountNavbar activePage="subscription" />
      <Container>
        <Stack align="center">
          <Text>
            This is a <span style={{ fontWeight: "bold" }}>free</span> early
            preview!
          </Text>
        </Stack>
        <Text>
          Please give feedbacks to{" "}
          <Anchor href="https://twitter.com/twips_xyz" target="_blank">
            @twips_xyz
          </Anchor>{" "}
          on Twitter
        </Text>
      </Container>
    </Group>
  );
};

export default Subscription;
