import { Group, Text } from "@mantine/core";
import { AccountNavbar } from "../../components/AccountNavbar";

const Subscription = () => {
  return (
    <Group>
      <AccountNavbar activePage="subscription" />
      <Text>Subscription</Text>
    </Group>
  );
};

export default Subscription;
