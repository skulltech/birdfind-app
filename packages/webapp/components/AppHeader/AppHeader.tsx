import {
  ActionIcon,
  Button,
  Group,
  Header,
  Title,
  UnstyledButton,
  useMantineColorScheme,
} from "@mantine/core";
import { useSupabaseClient } from "@supabase/auth-helpers-react";
import { IconBrandTwitter, IconMoonStars, IconSun } from "@tabler/icons";
import { useRouter } from "next/router";
import { useTwipsUser } from "../../providers/TwipsUserProvider";
import { JobMenu } from "./JobMenu";
import { AccountMenu } from "./AccountMenu";

type AppHeaderProps = {
  [x: string]: any;
};

export const AppHeader = ({ ...others }: AppHeaderProps) => {
  const supabase = useSupabaseClient();
  const router = useRouter();
  const { colorScheme, toggleColorScheme } = useMantineColorScheme();
  const { user } = useTwipsUser();

  const dark = colorScheme === "dark";

  return (
    <Header height={60} {...others}>
      <Group position="apart">
        <Group>
          <UnstyledButton onClick={() => router.push("/")}>
            <Title order={2}>
              <Group>
                <IconBrandTwitter />
                Twips
              </Group>
            </Title>
          </UnstyledButton>
          <Button onClick={() => router.push("/search")}>Search</Button>
        </Group>

        <Group>
          {user && (
            <>
              <JobMenu />
              <AccountMenu />
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
