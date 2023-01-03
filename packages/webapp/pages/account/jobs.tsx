import { Group, LoadingOverlay, ScrollArea, Stack, Text } from "@mantine/core";
import { AccountNavbar } from "../../components/AccountNavbar";
import { JobItem } from "../../components/JobItem";
import { useTwipsJobs } from "../../providers/TwipsJobsProvider";

const Jobs = () => {
  const { jobs, loading } = useTwipsJobs();

  return (
    <Group>
      <AccountNavbar activePage="jobs" />
      <Stack style={{ flex: 1 }}>
        <Text pl={2}>{jobs.length ? jobs.length : "No"} active jobs</Text>
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
