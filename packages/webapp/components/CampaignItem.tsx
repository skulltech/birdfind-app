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
import { useJobs } from "../providers/JobsProvider";
import { Job } from "../utils/helpers";

type CampaignItemProps = {
  campaign: { id; name; paused; created_at };
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

export const CampaignItem = ({
  campaign: { id, name, paused, created_at },
}: CampaignItemProps) => {
  const [pauseLoading, setPauseLoading] = useState(false);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const { pauseJob, deleteJob } = useJobs();
  const { classes } = useStyles();

  return (
    <Paper
      withBorder
      p="xs"
      radius="md"
      className={classes.jobItem}
      shadow="md"
    >
      <Stack pr="md" spacing="sm">
        <Group position="apart">
          <Stack spacing={2}>
            <Text size="md">{name}</Text>
            <Text c="dimmed">Created at {created_at.toLocaleString()}</Text>
            <Text c="dimmed">Status: {paused ? "Paused" : "Active"}</Text>
          </Stack>
          <Group>
            <ActionIcon
              size="sm"
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
      </Stack>
    </Paper>
  );
};
