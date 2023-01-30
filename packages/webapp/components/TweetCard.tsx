import { Avatar, Group, Stack, Text, UnstyledButton } from "@mantine/core";
import { CampaignTweet } from "../utils/tweets";

type TweetCardProps = {
  campaignTweet: CampaignTweet;
};

export const TweetCard = ({
  campaignTweet: {
    id,
    text,
    author: { id: authorId, name, username, profileImageUrl },
    tweetCreatedAt,
  },
}: TweetCardProps) => {
  return (
    <Group position="apart" noWrap>
      <UnstyledButton
        style={{ fontSize: 14 }}
        component="a"
        href={"https://twitter.com/" + username}
        target="_blank"
      >
        <Group noWrap align="start">
          <Avatar
            size="lg"
            radius="xl"
            src={profileImageUrl.replace("_normal", "_x96")}
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
            <Text c="dimmed">@{username}</Text>
            <Text>{text}</Text>
          </Stack>
        </Group>
      </UnstyledButton>
    </Group>
  );
};
