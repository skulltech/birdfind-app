import { Group, Text } from "@mantine/core";
import { AccountNavbar } from "../../components/AccountNavbar";

const Jobs = () => {
  return (
    <Group>
      <AccountNavbar activePage="jobs" />
      <Text>Jobs</Text>
    </Group>
  );
};

export default Jobs;
