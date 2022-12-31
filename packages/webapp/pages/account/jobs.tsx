import {
  ActionIcon,
  Center,
  CloseButton,
  Group,
  Loader,
  Paper,
  Progress,
  ScrollArea,
  Stack,
  Text,
} from "@mantine/core";
import { IconPlayerPause, IconPlayerPlay } from "@tabler/icons";
import { useState } from "react";
import { AccountNavbar } from "../../components/AccountNavbar";
import { Job, useTwipsJobs } from "../../providers/TwipsJobsProvider";

type JobChipProps = {
  job: Job;
};

const JobChip = ({
  job: { id, name, label, paused, progress },
}: JobChipProps) => {
  const [pauseLoading, setPauseLoading] = useState(false);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const { pauseJob, deleteJob } = useTwipsJobs();

  return (
    <Paper shadow="md" withBorder p="xs" radius="md">
      <Stack pr="md">
        <Group position="apart">
          <Group>
            <Text>{label}</Text>
          </Group>
          <Group>
            <ActionIcon
              size="sm"
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
              size="sm"
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
          label={`${progress.toFixed(0)}%`}
          size="xl"
        />
      </Stack>
    </Paper>
  );
};

const Jobs = () => {
  const { jobs, loading } = useTwipsJobs();

  return (
    <Group>
      <AccountNavbar activePage="jobs" />
      {loading ? (
        <Loader />
      ) : jobs.length == 0 ? (
        <Center style={{ flex: 1 }}>
          <Text>No jobs</Text>
        </Center>
      ) : (
        <ScrollArea style={{ height: "80vh", flex: 1 }}>
          <Stack>
            {jobs.map((job) => (
              <JobChip key={job.id} job={job} />
            ))}
          </Stack>
        </ScrollArea>
      )}
    </Group>
  );
};

export default Jobs;
