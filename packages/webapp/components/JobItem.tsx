import {
  ActionIcon,
  CloseButton,
  createStyles,
  Group,
  Paper,
  Progress,
  Stack,
  Text,
} from "@mantine/core";
import { IconPlayerPause, IconPlayerPlay } from "@tabler/icons";
import { useState } from "react";
import { Job, useJobs } from "../providers/JobsProvider";

type JobItemProps = {
  job: Job;
  compact: boolean;
};

const useStyles = createStyles((theme) => ({
  jobItem: {
    backgroundColor:
      theme.colorScheme === "dark" ? theme.colors.dark[6] : theme.colors.white,

    "&:hover": {
      backgroundColor:
        theme.colorScheme === "dark"
          ? theme.colors.dark[4]
          : theme.colors.gray[0],
    },
  },
}));

export const JobItem = ({
  job: { id, name, label, paused, progress, createdAt },
  compact,
}: JobItemProps) => {
  const [pauseLoading, setPauseLoading] = useState(false);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const { pauseJob, deleteJob } = useJobs();
  const { classes } = useStyles();

  return (
    <Paper
      withBorder={!compact}
      p="xs"
      radius="md"
      className={classes.jobItem}
      shadow={compact ? "none" : "md"}
    >
      <Stack pr={compact ? "none" : "md"} spacing={compact ? 3 : "sm"}>
        <Group position="apart">
          <Stack spacing={2}>
            <Text size={compact ? "sm" : "md"}>{label}</Text>
            {!compact && (
              <Text c="dimmed">Created at {createdAt.toLocaleString()}</Text>
            )}
          </Stack>
          <Group>
            <ActionIcon
              size={compact ? "xs" : "sm"}
              color={paused ? "green" : "yellow"}
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
              size={compact ? "xs" : "sm"}
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
          value={progress}
          label={compact ? null : progress.toFixed(0) + "%"}
          size={compact ? "md" : "lg"}
        />
      </Stack>
    </Paper>
  );
};
