import { Group, Text } from "@mantine/core";
import { AccountNavbar } from "../../components/AccountNavbar";

const Notifications = () => {
  return (
    <Group>
      <AccountNavbar activePage="notifications" />
      <Text>Notifiaction</Text>
    </Group>
  );
};

export default Notifications;
