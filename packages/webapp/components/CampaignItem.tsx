import { Button, createStyles, Group, Paper, Stack, Text } from "@mantine/core";

type CampaignItemProps = {
  campaign: { id; name; paused; created_at };
};

export const CampaignItem = ({
  campaign: { id, name, paused, created_at },
}: CampaignItemProps) => {
  return (
    <Paper withBorder p="xs" radius="md" shadow="md">
      <Group position="apart">
        <Stack pr="md" spacing="sm">
          <Group position="apart">
            <Stack spacing={2}>
              <Text size="md">{name}</Text>
              <Text c="dimmed">
                Created at {new Date(created_at).toLocaleString()}
              </Text>
              <Text c="dimmed">Status: {paused ? "Paused" : "Active"}</Text>
            </Stack>
          </Group>
        </Stack>
        <Button component="a" href={"/campaigns/" + id}>
          Open campaign
        </Button>
      </Group>
    </Paper>
  );
};
