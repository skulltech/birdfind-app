import { Avatar, Menu, UnstyledButton } from "@mantine/core";
import { useSupabaseClient } from "@supabase/auth-helpers-react";
import { IconLogout } from "@tabler/icons";
import { useRouter } from "next/router";
import { useUser } from "../../providers/UserProvider";
import { accountMenuItems } from "../../utils/helpers";

export const AccountMenu = () => {
  const { user } = useUser();
  const router = useRouter();
  const supabase = useSupabaseClient();

  return (
    <Menu shadow="md">
      <Menu.Target>
        <UnstyledButton>
          <Avatar
            src={user.twitter?.profileImageUrl}
            radius="xl"
            size="md"
            variant="outline"
          />
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
