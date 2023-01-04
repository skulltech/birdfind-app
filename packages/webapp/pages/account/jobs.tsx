import { Group, LoadingOverlay, ScrollArea, Stack, Text } from "@mantine/core";
import { AccountNavbar } from "../../components/AccountNavbar";
import { JobItem } from "../../components/JobItem";
import { useJobs } from "../../providers/JobsProvider";

const Jobs = () => {
  const { jobs, loading } = useJobs();

  return (
    <Group>
      <AccountNavbar activePage="jobs" />
      <Stack style={{ flex: 1 }}>
        <Text pl={2}>
          {jobs.length ? jobs.length : "No"} {jobs.length == 1 ? "job" : "job"}
        </Text>
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
