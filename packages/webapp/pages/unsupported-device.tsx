import { Center, Text } from "@mantine/core";

const MobileNotSupported = () => {
  return (
    <Center p="lg">
      <Text>
        Mobile browsers are not supported, please access Twips from a desktop
        browser.
      </Text>
    </Center>
  );
};

export default MobileNotSupported;
