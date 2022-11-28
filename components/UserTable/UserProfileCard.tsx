import { Avatar, Card, Group, Paper, Stack, Text } from "@mantine/core";

export type UserProfileCardProps = {
  username: string;
  name: string;
  description: string;
  profileImageUrl: string | null;
};

export const UserProfileCard = ({
  username,
  name,
  description,
  profileImageUrl,
}: UserProfileCardProps) => {
  return (
    <Paper shadow="sm" radius="md" p="sm">
      <Stack spacing="xs">
        <Group position="left">
          <Avatar
            component="a"
            href={"https://twitter.com/" + username}
            target="_blank"
            radius="xl"
            src={profileImageUrl}
            style={{ position: "unset" }}
          />
          <Stack spacing={0}>
            <Text weight="bold">{name}</Text>
            <Text c="dimmed">@{username}</Text>
          </Stack>
        </Group>
        <Text size="sm">{description}</Text>
      </Stack>
    </Paper>
  );
};
