import {
  ActionIcon,
  Badge,
  Center,
  CloseButton,
  createStyles,
  Group,
  Paper,
  Progress,
  Stack,
  Text,
} from "@mantine/core";
import {
  IconCircleCheck,
  IconPlayerPause,
  IconPlayerPlay,
} from "@tabler/icons";
import { useState } from "react";
import { Job, useTwipsJobs } from "../providers/TwipsJobsProvider";

type JobItemProps = {
  job: Job;
  compact: boolean;
};

const useStyles = createStyles((theme) => ({
  jobItem: {
    "&:hover": {
      backgroundColor:
        theme.colorScheme === "dark"
          ? theme.colors.dark[6]
          : theme.colors.gray[0],
    },
  },
}));

export const JobItem = ({
  job: { id, name, label, paused, progress, createdAt, finished },
  compact,
}: JobItemProps) => {
  const [pauseLoading, setPauseLoading] = useState(false);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const { pauseJob, deleteJob } = useTwipsJobs();
  const { classes } = useStyles();

  return (
    <Paper
      withBorder={!compact}
      p="xs"
      radius="md"
      className={classes.jobItem}
      shadow={compact ? "none" : "md"}
    >
      <Stack pr={compact ? "none" : "md"} spacing="sm">
        <Group position="apart">
          <Stack spacing={2}>
            <Text size={compact ? "sm" : "md"}>{label}</Text>
            <Text c="dimmed" size={compact ? "xs" : "md"}>
              Created at {createdAt.toLocaleString()}
            </Text>
          </Stack>
          {finished ? (
            <Badge
              size={compact ? "sm" : "lg"}
              variant="outline"
              sx={{ textTransform: "none" }}
              leftSection={
                <Center>
                  <IconCircleCheck
                    radius="xl"
                    size={compact ? 12 : 16}
                    color="green"
                  />
                </Center>
              }
            >
              Finished
            </Badge>
          ) : (
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
          )}
        </Group>
        <Progress
          value={progress}
          label={progress.toFixed(0) + "%"}
          size="lg"
        />
      </Stack>
    </Paper>
  );
};
