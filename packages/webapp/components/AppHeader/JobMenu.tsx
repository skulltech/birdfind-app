import { Button, Center, Indicator, Menu, Stack, Text } from "@mantine/core";
import { IconChevronDown, IconSubtask } from "@tabler/icons";
import { useRouter } from "next/router";
import { useTwipsJobs } from "../../providers/TwipsJobsProvider";
import { JobItem } from "../JobItem";

const numJobsToShow = 3;

export const JobMenu = () => {
  const { jobs } = useTwipsJobs();
  const router = useRouter();

  return (
    <Menu shadow="md">
      <Menu.Target>
        <Indicator
          label={jobs.length}
          inline
          size={16}
          processing
          showZero={false}
          dot={false}
        >
          <Button
            variant="outline"
            leftIcon={<IconSubtask size={16} stroke={1.5} />}
            rightIcon={<IconChevronDown size={16} />}
          >
            Background jobs
          </Button>
        </Indicator>
      </Menu.Target>

      <Menu.Dropdown>
        <Menu.Label>{jobs.length ? jobs.length : "No"} active jobs</Menu.Label>

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
          Manage all jobs
        </Menu.Item>
      </Menu.Dropdown>
    </Menu>
  );
};
