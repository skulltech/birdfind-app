import { Group, LoadingOverlay, ScrollArea, Stack, Text } from "@mantine/core";
import { AccountNavbar } from "../../components/AccountNavbar";
import { JobItem } from "../../components/JobItem";
import { useJobs } from "../../providers/JobsProvider";

const Jobs = () => {
  const { jobs, loading } = useJobs();

  return (
    <Group align="flex-start">
      <AccountNavbar activePage="jobs" />
      <Stack style={{ flex: 1 }} align="center" p="md">
        <Text>
          {jobs.length ? jobs.length : "No"} {jobs.length == 1 ? "job" : "jobs"}
        </Text>
        <ScrollArea
          sx={{
            height: "calc(100vh - var(--mantine-header-height, 0px) - 56px)",
            width: "100%",
          }}
        >
          <div style={{ position: "relative" }}>
            <LoadingOverlay visible={loading} overlayBlur={2} />
            <Stack sx={{ flex: 1 }}>
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
