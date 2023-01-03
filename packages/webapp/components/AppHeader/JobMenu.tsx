import {
  ActionIcon,
  Button,
  Center,
  Group,
  Menu,
  Stack,
  Text,
} from "@mantine/core";
import { IconChevronDown, IconRefresh, IconSubtask } from "@tabler/icons";
import { useRouter } from "next/router";
import { useTwipsJobs } from "../../providers/TwipsJobsProvider";
import { JobItem } from "../JobItem";

const numJobsToShow = 3;

export const JobMenu = () => {
  const { jobs, loading, refresh } = useTwipsJobs();
  const router = useRouter();
  const numActiveJobs = jobs.map((x) => !x.finished).length;

  return (
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
        <Menu.Label>
          <Group position="apart">
            <Text>{numActiveJobs ? numActiveJobs : "No"} active jobs</Text>
            <ActionIcon onClick={refresh} loading={loading}>
              <IconRefresh size={14} />
            </ActionIcon>
          </Group>
        </Menu.Label>

        <Stack p={0} pt={2}>
          {jobs.slice(0, numJobsToShow).map((job) => (
            // <JobMenuItem {...job} key={job.id} />
            <JobItem job={job} key={job.id} compact={true} />
          ))}
          {jobs.length > numJobsToShow && (
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
  );
};
