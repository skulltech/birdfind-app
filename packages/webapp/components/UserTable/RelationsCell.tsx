import { ActionIcon, Group, Text } from "@mantine/core";
import { IconSettings } from "@tabler/icons";
import { SearchResult } from "../../utils/supabase";
import { ActionMenu } from "./ActionMenu";

type RelationsCellProps = {
  profile: SearchResult;
  lists: any[];
  refreshLists: () => void;
  listsLoading: boolean;
};

export const RelationsCell = ({
  profile,
  lists,
  refreshLists,
  listsLoading,
}: RelationsCellProps) => {
  // Relation label
  let label: string;

  if (profile.isBlocked) {
    if (profile.isMuted) label = "Blocked and muted";
    else label = "Blocked";
  } else {
    if (profile.isMuted) {
      if (profile.isFollower && profile.isFollowing) label = "Mutual, muted";
      else if (profile.isFollower) label = "Follows you, muted";
      else if (profile.isFollowing) label = "Followed by you, muted";
      else label = "muted";
    } else {
      if (profile.isFollower && profile.isFollowing) label = "Mutual";
      else if (profile.isFollower) label = "Follows you";
      else if (profile.isFollowing) label = "Followed by you";
    }
  }

  return (
    <Group position="apart" noWrap spacing={1}>
      <Text>{label}</Text>
      <ActionMenu
        target={
          <ActionIcon>
            <IconSettings size={16} />
          </ActionIcon>
        }
        users={[profile]}
        lists={lists}
        refreshLists={refreshLists}
        listsLoading={listsLoading}
      />
    </Group>
  );
};
