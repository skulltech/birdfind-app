import {
  ActionIcon,
  Group,
  LoadingOverlay,
  ScrollArea,
  Stack,
  Text,
} from "@mantine/core";
import { IconRefresh } from "@tabler/icons";
import { AccountNavbar } from "../../components/AccountNavbar";
import { JobItem } from "../../components/JobItem";
import { useTwipsJobs } from "../../providers/TwipsJobsProvider";

const Jobs = () => {
  const { jobs, loading, refresh } = useTwipsJobs();
  const numActiveJobs = jobs.filter((x) => !x.finished).length;

  return (
    <Group>
      <AccountNavbar activePage="jobs" />
      <Stack style={{ flex: 1 }}>
        <Group position="apart" pt="lg">
          <Text>{numActiveJobs ? numActiveJobs : "No"} active jobs</Text>
          <ActionIcon onClick={refresh}>
            <IconRefresh />
          </ActionIcon>
        </Group>
        <ScrollArea style={{ height: "80vh" }}>
          <div style={{ position: "relative" }}>
            <LoadingOverlay visible={loading} overlayBlur={2} />
            <Stack>
              {jobs.map((job) => (
                <JobItem key={job.id} job={job} compact={false} />
              ))}
            </Stack>
          </div>
        </ScrollArea>
      </Stack>
    </Group>
  );
};

export default Jobs;
