import { Avatar, Group, Paper, Stack, Text } from "@mantine/core";

export type TwitterUserProfileProps = {
  username: string;
  name: string;
  description: string;
  profileImageUrl: string | null;
};

export const TwitterUserProfile = ({
  username,
  name,
  description,
  profileImageUrl,
}: TwitterUserProfileProps) => {
  return (
    <Paper>
      <Group>
        <Avatar radius="xl" src={profileImageUrl} />
        <Stack>
          <Group spacing="xs">
            <Text weight="bold">{name}</Text>
            <Text c="dimmed">@{username}</Text>
          </Group>
          <Text size="sm">{description}</Text>
        </Stack>
      </Group>
    </Paper>
  );
};
