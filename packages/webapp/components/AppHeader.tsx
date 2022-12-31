import {
  ActionIcon,
  Avatar,
  Burger,
  Button,
  Center,
  CloseButton,
  Group,
  Header,
  MediaQuery,
  Menu,
  Progress,
  Stack,
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
  IconPlayerPause,
  IconPlayerPlay,
  IconSubtask,
  IconSun,
} from "@tabler/icons";
import { useRouter } from "next/router";
import { useState } from "react";
import { accountMenuItems } from "../utils/helpers";
import { useTwipsUser } from "../providers/TwipsUserProvider";
import { useTwipsJobs, Job } from "../providers/TwipsJobsProvider";

type AppHeaderProps = {
  [x: string]: any;
};

const numJobsToShowInMenu = 1;

const JobMenuItem = ({ id, name, label, progress, paused }: Job) => {
  const [pauseLoading, setPauseLoading] = useState(false);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const { pauseJob, deleteJob } = useTwipsJobs();

  return (
    <Stack spacing={3}>
      <Group position="apart">
        <Group>
          <Text size="sm">{label}</Text>
        </Group>
        <Group>
          <ActionIcon
            size="xs"
            onClick={async () => {
              setPauseLoading(true);
              await pauseJob(name, id, !paused);
              setPauseLoading(false);
            }}
            loading={pauseLoading}
          >
            {paused ? <IconPlayerPlay /> : <IconPlayerPause />}
          </ActionIcon>
          <CloseButton
            size="xs"
            radius="lg"
            variant="outline"
            color="red"
            onClick={async () => {
              setDeleteLoading(true);
              await deleteJob(name, id);
              setDeleteLoading(false);
            }}
            loading={deleteLoading}
          />
        </Group>
      </Group>
      <Progress
        // animate
        value={progress}
        size="sm"
      />
    </Stack>
  );
};

export const AppHeader = ({ ...others }: AppHeaderProps) => {
  const supabase = useSupabaseClient();
  const router = useRouter();
  const { colorScheme, toggleColorScheme } = useMantineColorScheme();
  const { user } = useTwipsUser();
  const theme = useMantineTheme();
  const [opened, setOpened] = useState(false);

  const { jobs } = useTwipsJobs();

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
                  <Button
                    variant="outline"
                    leftIcon={<IconSubtask size={16} stroke={1.5} />}
                    rightIcon={<IconChevronDown size={16} />}
                  >
                    Background jobs
                  </Button>
                </Menu.Target>

                <Menu.Dropdown>
                  <Menu.Label>{jobs.length} active jobs</Menu.Label>

                  <Stack p="sm" pt={2}>
                    {jobs.slice(0, numJobsToShowInMenu).map((job) => (
                      <JobMenuItem {...job} key={job.id} />
                    ))}
                    {jobs.length > numJobsToShowInMenu && (
                      <Center>
                        <Text size="sm" c="dimmed" weight="bold">
                          ...
                        </Text>
                      </Center>
                    )}
                  </Stack>
                  <Menu.Divider />
                  <Menu.Item
                    component="a"
                    href={"/account/jobs"}
                    icon={<IconSubtask size={14} />}
                    onClick={(event) => {
                      event.preventDefault();
                      router.push("/account/jobs");
                    }}
                  >
                    Manage all jobs
                  </Menu.Item>
                </Menu.Dropdown>
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
