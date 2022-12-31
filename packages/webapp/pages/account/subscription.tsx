import { Container, Group, Text } from "@mantine/core";
import { AccountNavbar } from "../../components/AccountNavbar";

const Subscription = () => {
  return (
    <Group>
      <AccountNavbar activePage="subscription" />
      <Container>
        <Text>Subscription</Text>
      </Container>
    </Group>
  );
};

export default Subscription;
