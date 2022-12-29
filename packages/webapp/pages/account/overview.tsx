import { Group, Text } from "@mantine/core";
import { AccountNavbar } from "../../components/AccountNavbar";

const Overview = () => {
  return (
    <Group>
      <AccountNavbar activePage="overview" />
      <Text>Overview</Text>
    </Group>
  );
};

export default Overview;
