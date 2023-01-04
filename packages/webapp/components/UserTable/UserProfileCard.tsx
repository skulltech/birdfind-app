import {
  ActionIcon,
  Anchor,
  Avatar,
  Group,
  HoverCard,
  Stack,
  Text,
  UnstyledButton,
} from "@mantine/core";
import { IconInfoCircle, IconLink, IconMapPin } from "@tabler/icons";
import { TwitterProfile } from "../../utils/helpers";

export type UserProfileCardProps = {
  profile: TwitterProfile;
};

export const UserProfileCard = ({
  profile: { username, name, description, profileImageUrl, location, url },
}: UserProfileCardProps) => {
  return (
    <Group position="apart" noWrap>
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
                maxWidth: 150,
                overflow: "hidden",
                display: "block",
                textOverflow: "ellipsis",
                whiteSpace: "nowrap",
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
      <HoverCard width={400} shadow="md" position="bottom-start" withArrow>
        <HoverCard.Target>
          <ActionIcon>
            <IconInfoCircle size={16} />
          </ActionIcon>
        </HoverCard.Target>
        <HoverCard.Dropdown>
          <Stack spacing="xs">
            <Stack spacing={0}>
              <Text weight="bold">{name}</Text>
              <Text c="dimmed" size="sm">
                @{username}
              </Text>
            </Stack>
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
        </HoverCard.Dropdown>
      </HoverCard>
    </Group>
  );
};
