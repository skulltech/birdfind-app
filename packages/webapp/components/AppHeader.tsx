import { Avatar, Group, Header, Menu, Text, Title } from "@mantine/core";
import { IconBrandTwitter, IconLogout } from "@tabler/icons";
import { signOut, useSession } from "next-auth/react";

export const AppHeader = () => {
  const { data: session } = useSession();

  return (
    <Header height={60} p="xs">
      <Group position="apart">
        <Title order={2}>
          <Group>
            <IconBrandTwitter />
            Twips
          </Group>
        </Title>
        {session && (
          <Menu shadow="md" trigger="hover">
            <Menu.Target>
              <Group>
                <Avatar
                  src={session.twitter.profile.profile_image_url}
                  radius="xl"
                />
                <div>
                  <Text size="sm" weight={500}>
                    @{session.twitter.profile.username}
                  </Text>
                  <Text color="dimmed" size="xs">
                    {session.user.email}
                  </Text>
                </div>
              </Group>
            </Menu.Target>

            <Menu.Dropdown>
              <Menu.Item
                color="red"
                icon={<IconLogout size={14} />}
                onClick={() => signOut()}
              >
                Sign out
              </Menu.Item>
            </Menu.Dropdown>
          </Menu>
        )}
      </Group>
    </Header>
  );
};
