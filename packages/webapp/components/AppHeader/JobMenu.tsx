import { Button, Center, Indicator, Menu, Stack, Text } from "@mantine/core";
import { IconChevronDown, IconSubtask } from "@tabler/icons";
import { useRouter } from "next/router";
import { useJobs } from "../../providers/JobsProvider";
import { JobItem } from "../JobItem";

const numJobsToShow = 3;

export const JobMenu = () => {
  const { jobs } = useJobs();
  const router = useRouter();
  const allJobsPaused = jobs.filter((x) => !x.paused).length == 0;

  return (
    <Menu shadow="md">
      <Menu.Target>
        <Indicator
          label={jobs.length}
          inline
          size={16}
          processing={allJobsPaused ? false : true}
          color={allJobsPaused ? "yellow" : "blue"}
          showZero={false}
          dot={false}
        >
          <Button
            variant="outline"
            leftIcon={<IconSubtask size={16} stroke={1.5} />}
            rightIcon={<IconChevronDown size={16} />}
          >
            Jobs
          </Button>
        </Indicator>
      </Menu.Target>

      <Menu.Dropdown>
        <Menu.Label>
          {jobs.length ? jobs.length : "No"} {jobs.length == 1 ? "job" : "jobs"}
        </Menu.Label>

        <Stack p={0} spacing={0}>
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
          icon={<IconSubtask size={16} stroke={1.5} />}
          onClick={(event) => {
            event.preventDefault();
            router.push("/account/jobs");
          }}
        >
          More job details
        </Menu.Item>
      </Menu.Dropdown>
    </Menu>
  );
};
