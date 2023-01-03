import { Avatar, Group, Menu, Text, UnstyledButton } from "@mantine/core";
import { useSupabaseClient } from "@supabase/auth-helpers-react";
import { IconChevronDown, IconLogout } from "@tabler/icons";
import { useRouter } from "next/router";
import { useTwipsUser } from "../../providers/TwipsUserProvider";
import { accountMenuItems } from "../../utils/helpers";

export const AccountMenu = () => {
  const { user } = useTwipsUser();
  const router = useRouter();
  const supabase = useSupabaseClient();

  return (
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
  );
};
