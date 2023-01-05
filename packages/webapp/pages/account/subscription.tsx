import { Anchor, Group, Stack, Text } from "@mantine/core";
import { AccountNavbar } from "../../components/AccountNavbar";

const Subscription = () => {
  return (
    <Group align="flex-start">
      <AccountNavbar activePage="subscription" />
      <Stack align="center" p="md" spacing="sm" sx={{ flex: 1, width: "100%" }}>
        <Text>
          This is a <span style={{ fontWeight: "bold" }}>free</span> early
          preview!
        </Text>
        <Text>
          Please give feedbacks to{" "}
          <Anchor href="https://twitter.com/twips_xyz" target="_blank">
            @twips_xyz
          </Anchor>{" "}
          on Twitter
        </Text>
      </Stack>
    </Group>
  );
};

export default Subscription;
