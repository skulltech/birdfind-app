import {
  Avatar,
  createStyles,
  Group,
  Indicator,
  Menu,
  Text,
  UnstyledButton,
} from "@mantine/core";
import { useSupabaseClient } from "@supabase/auth-helpers-react";
import { IconChevronDown, IconLogout } from "@tabler/icons";
import { useRouter } from "next/router";
import { useUser } from "../../providers/TwipsUserProvider";
import { accountMenuItems } from "../../utils/helpers";

const useStyles = createStyles((theme) => ({
  target: {
    "&:hover": {
      backgroundColor:
        theme.colorScheme === "dark"
          ? theme.colors.dark[6]
          : theme.colors.gray[0],
    },
  },
}));

export const AccountMenu = () => {
  const { user } = useUser();
  const router = useRouter();
  const supabase = useSupabaseClient();
  const { classes } = useStyles();

  return (
    <Menu shadow="md">
      <Menu.Target>
        <UnstyledButton
          className={classes.target}
          sx={{
            paddingTop: 2,
            paddingBottom: 2,
            paddingLeft: 5,
            paddingRight: 5,
            borderRadius: 10,
          }}
        >
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
