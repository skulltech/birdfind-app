import {
  ActionIcon,
  Avatar,
  Burger,
  Button,
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
  IconChevronDown,
  IconLogout,
  IconMoonStars,
  IconSun,
} from "@tabler/icons";
import { useRouter } from "next/router";
import { useState } from "react";
import { accountMenuItems } from "../utils/helpers";
import { useTwips } from "./TwipsProvider";

type AppHeaderProps = {
  [x: string]: any;
};

export const AppHeader = ({ ...others }: AppHeaderProps) => {
  const supabase = useSupabaseClient();
  const router = useRouter();
  const { colorScheme, toggleColorScheme } = useMantineColorScheme();
  const { user } = useTwips();
  const theme = useMantineTheme();
  const [opened, setOpened] = useState(false);

  const dark = colorScheme === "dark";

  return (
    <Header height={60} {...others}>
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

        <Group>
          {user && (
            <>
              <Menu shadow="md">
                <Menu.Target>
                  <Button>Background jobs</Button>
                </Menu.Target>

                <Menu.Dropdown></Menu.Dropdown>
              </Menu>
              <Menu shadow="md">
                <Menu.Target>
                  <UnstyledButton>
                    <Group spacing="xs">
                      <Avatar src={user.twitter?.profileImageUrl} radius="xl" />
                      <div>
                        <Text size="sm" weight={500}>
                          @{user.twitter?.username ?? "username"}
                        </Text>
                        <Text color="dimmed" size="xs">
                          {user.email}
                        </Text>
                      </div>
                      <IconChevronDown size={14} />
                    </Group>
                  </UnstyledButton>
                </Menu.Target>

                <Menu.Dropdown>
                  {accountMenuItems.map((item) => (
                    <Menu.Item
                      key={item.page}
                      component="a"
                      href={"/account/" + item.page}
                      icon={<item.icon size={16} stroke={1.5} />}
                      onClick={(event) => {
                        event.preventDefault();
                        router.push("/account/" + item.page);
                      }}
                    >
                      {item.label}
                    </Menu.Item>
                  ))}

                  <Menu.Divider />

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
            </>
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
