import {
  Anchor,
  Avatar,
  Group,
  HoverCard,
  Paper,
  Stack,
  Text,
  UnstyledButton,
} from "@mantine/core";
import { IconLink, IconMapPin } from "@tabler/icons";
import { TwitterProfile } from "@twips/lib";

export type UserProfileCardProps = {
  profile: TwitterProfile;
};

export const UserProfileCard = ({
  profile: { username, name, description, profileImageUrl, location, url },
}: UserProfileCardProps) => {
  return (
    <Group>
      <HoverCard width={400} shadow="md" position="bottom-start">
        <HoverCard.Target>
          <UnstyledButton
            style={{ fontSize: 14 }}
            component="a"
            href={"https://twitter.com/" + username}
            target="_blank"
          >
            <Group noWrap>
              <Avatar
                radius="xl"
                src={profileImageUrl}
                style={{ position: "unset" }}
              />
              <Stack spacing={0}>
                <Text
                  weight="bold"
                  style={{
                    whiteSpace: "nowrap",
                    textOverflow: "ellipsis",
                    overflow: "hidden",
                  }}
                >
                  {name}
                </Text>
                <Text c="dimmed" size="sm">
                  @{username}
                </Text>
              </Stack>
            </Group>
          </UnstyledButton>
        </HoverCard.Target>
        <HoverCard.Dropdown>
          <Paper>
            <Stack spacing="xs">
              <Text size="sm">{description}</Text>
              <Group noWrap spacing="xs">
                {location && (
                  <Group spacing={5} noWrap>
                    <IconMapPin size={14} />
                    <Text style={{ whiteSpace: "nowrap" }} c="dimmed">
                      {location}
                    </Text>
                  </Group>
                )}
                {url && (
                  <Group spacing={5} noWrap>
                    <IconLink size={14} />
                    <Anchor href={url} target="_blank">
                      {url}
                    </Anchor>
                  </Group>
                )}
              </Group>
            </Stack>
          </Paper>
        </HoverCard.Dropdown>
      </HoverCard>
    </Group>
  );
};
