import {
  ActionIcon,
  Button,
  Center,
  Group,
  Indicator,
  Menu,
  Stack,
  Text,
} from "@mantine/core";
import { usePrevious } from "@mantine/hooks";
import { IconChevronDown, IconRefresh, IconSubtask } from "@tabler/icons";
import { useRouter } from "next/router";
import { useEffect, useState } from "react";
import { Job, useTwipsJobs } from "../../providers/TwipsJobsProvider";
import { JobItem } from "../JobItem";

const numJobsToShow = 3;

// Check if two Job[] are equal
const compareJobArrays = (arg1: Job[], arg2: Job[]) => {
  // Compare length
  if (arg1.length !== arg2.length) return false;

  // Compare stringified items
  const jsonArg1 = arg1.map((x) => JSON.stringify(x));
  const jsonArg2 = arg2.map((x) => JSON.stringify(x));
  for (const item of jsonArg1) if (!jsonArg2.includes(item)) return false;

  return true;
};

export const JobMenu = () => {
  const { jobs, loading, refresh } = useTwipsJobs();
  const router = useRouter();
  const numActiveJobs = jobs.map((x) => !x.finished).length;

  // Set indicator for change
  const [indicateChange, setIndicateChange] = useState(false);
  const previousJobs = usePrevious(jobs);

  useEffect(() => {
    if (previousJobs != undefined && !compareJobArrays(jobs, previousJobs))
      setIndicateChange(true);
  }, [jobs, previousJobs]);

  return (
    <Menu shadow="md">
      <Menu.Target>
        <Indicator disabled={!indicateChange}>
          <Button
            variant="outline"
            leftIcon={<IconSubtask size={16} stroke={1.5} />}
            rightIcon={<IconChevronDown size={16} />}
            onClick={() => setIndicateChange(false)}
          >
            Background jobs
          </Button>
        </Indicator>
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
