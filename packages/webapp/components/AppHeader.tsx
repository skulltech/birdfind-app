import {
  ActionIcon,
  Avatar,
  Burger,
  Group,
  Header,
  MediaQuery,
  Menu,
  Text,
  Title,
  UnstyledButton,
  useMantineColorScheme,
  useMantineTheme,
} from "@mantine/core";
import { useSupabaseClient } from "@supabase/auth-helpers-react";
import {
  IconBrandTwitter,
  IconLogout,
  IconMoonStars,
  IconSun,
} from "@tabler/icons";
import { useRouter } from "next/router";
import { PromptInput } from "./FilterInputs/PromptInput";
import { useTwips } from "./TwipsProvider";

export const AppHeader = ({ opened, setOpened }) => {
  const supabase = useSupabaseClient();
  const router = useRouter();
  const { colorScheme, toggleColorScheme } = useMantineColorScheme();
  const { user } = useTwips();
  const theme = useMantineTheme();

  const dark = colorScheme === "dark";

  return (
    <Header height={60} p="xs">
      <Group position="apart">
        <div style={{ display: "flex", alignItems: "center", height: "100%" }}>
          <MediaQuery largerThan="sm" styles={{ display: "none" }}>
            <Burger
              opened={opened}
              onClick={() => setOpened((o) => !o)}
              size="sm"
              color={theme.colors.gray[6]}
              mr="xl"
            />
          </MediaQuery>
          <UnstyledButton onClick={() => router.push("/")}>
            <Title order={2}>
              <Group>
                <IconBrandTwitter />
                Twips
              </Group>
            </Title>
          </UnstyledButton>
        </div>

        <Group style={{ width: 500 }} grow>
          <PromptInput />
        </Group>

        <Group>
          {user && (
            <Menu shadow="md">
              <Menu.Target>
                <UnstyledButton>
                  <Group>
                    <Avatar src={user.twitter?.profileImageUrl} radius="xl">
                      {user.email[0].toUpperCase()}
                    </Avatar>
                    <div>
                      <Text size="sm" weight={500}>
                        @{user.twitter?.username ?? "username"}
                      </Text>
                      <Text color="dimmed" size="xs">
                        {user.email}
                      </Text>
                    </div>
                  </Group>
                </UnstyledButton>
              </Menu.Target>

              <Menu.Dropdown>
                <Menu.Item
                  icon={<IconBrandTwitter size={14} />}
                  onClick={() => router.push("/auth/twitter")}
                >
                  {user.twitter
                    ? "Connect to a different Twitter account"
                    : "Connect to Twitter"}
                </Menu.Item>
                <Menu.Item
                  color="red"
                  icon={<IconLogout size={14} />}
                  onClick={() => {
                    supabase.auth.signOut();
                    window.location.replace("/auth/signin");
                  }}
                >
                  Sign out
                </Menu.Item>
              </Menu.Dropdown>
            </Menu>
          )}

          <ActionIcon
            variant="outline"
            color={dark ? "yellow" : "blue"}
            onClick={() => toggleColorScheme()}
            title="Toggle color scheme"
          >
            {dark ? <IconSun size={18} /> : <IconMoonStars size={18} />}
          </ActionIcon>
        </Group>
      </Group>
    </Header>
  );
};
