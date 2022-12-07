import {
  Avatar,
  Group,
  Header,
  Menu,
  Text,
  Title,
  UnstyledButton,
} from "@mantine/core";
import { useSupabaseClient } from "@supabase/auth-helpers-react";
import { IconBrandTwitter, IconLogout } from "@tabler/icons";
import { useRouter } from "next/router";
import { useEffect, useState } from "react";
import { getUserDetails, UserDetails } from "../utils/supabase";

export const AppHeader = () => {
  const supabase = useSupabaseClient();
  const router = useRouter();
  const [user, setUser] = useState<UserDetails>(null);

  // Load user details
  useEffect(() => {
    const loadUserDetails = async () => {
      setUser(await getUserDetails(supabase));
    };
    loadUserDetails();
  }, [supabase]);

  useEffect(() => {
    console.log(user);
  }, [user]);

  return (
    <Header height={60} p="xs">
      <Group position="apart">
        <UnstyledButton onClick={() => router.push("/")}>
          <Title order={2}>
            <Group>
              <IconBrandTwitter />
              Twips
            </Group>
          </Title>
        </UnstyledButton>

        {user && (
          <Menu shadow="md" trigger="hover">
            <Menu.Target>
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
      </Group>
    </Header>
  );
};
