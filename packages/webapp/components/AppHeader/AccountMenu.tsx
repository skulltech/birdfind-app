import {
  Avatar,
  Center,
  ColorScheme,
  Menu,
  SegmentedControl,
  Text,
  UnstyledButton,
} from "@mantine/core";
import { useSupabaseClient } from "@supabase/auth-helpers-react";
import {
  IconDeviceLaptop,
  IconLogout,
  IconMoonStars,
  IconSun,
} from "@tabler/icons";
import { useRouter } from "next/router";
import { useUser } from "../../providers/UserProvider";
import { accountMenuItems } from "../../utils/helpers";

type AccountMenuProps = {
  colorScheme: ColorScheme | "system";
  changeColorScheme: (arg: ColorScheme | "system") => void;
};

export const AccountMenu = ({
  colorScheme,
  changeColorScheme,
}: AccountMenuProps) => {
  const { user } = useUser();
  const router = useRouter();
  const supabase = useSupabaseClient();

  return (
    <Menu shadow="md" position="bottom-end">
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
        <Menu.Label>Color Theme</Menu.Label>
        <Menu.Label>
          <SegmentedControl
            value={colorScheme}
            onChange={changeColorScheme}
            data={[
              {
                label: (
                  <Center>
                    <IconSun size={18} />
                    <Text ml={6}>Light</Text>
                  </Center>
                ),
                value: "light",
              },
              {
                label: (
                  <Center>
                    <IconMoonStars size={18} />
                    <Text ml={6}>Dark</Text>
                  </Center>
                ),
                value: "dark",
              },
              {
                label: (
                  <Center>
                    <IconDeviceLaptop size={18} />
                    <Text ml={6}>System</Text>
                  </Center>
                ),
                value: "system",
              },
            ]}
          />
        </Menu.Label>
        <Menu.Divider />
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
