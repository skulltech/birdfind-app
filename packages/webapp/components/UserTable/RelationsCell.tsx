import { ActionIcon, Group, Text, Tooltip } from "@mantine/core";
import { IconSettings } from "@tabler/icons";
import { SearchResult } from "../../utils/supabase";
import { ActionMenu } from "./ActionMenu";

type RelationsCellProps = {
  profile: SearchResult;
  lists: any[];
  refreshLists: () => void;
  refreshSearch: () => void;
  listsLoading: boolean;
};

export const RelationsCell = ({
  profile,
  lists,
  refreshLists,
  listsLoading,
  refreshSearch,
}: RelationsCellProps) => {
  // Relation label
  let label: string;
  let tooltipLabel: string;

  if (profile.isBlocked) {
    if (profile.isMuted)
      [label, tooltipLabel] = [
        "Blocked, muted",
        "You have blocked and muted this user",
      ];
    else [label, tooltipLabel] = ["Blocked", "You have blocked this user"];
  } else {
    if (profile.isMuted) {
      if (profile.isFollower && profile.isFollowing)
        [label, tooltipLabel] = [
          "Mutual, muted",
          "You and this user follow each other, and you have muted them",
        ];
      else if (profile.isFollower)
        [label, tooltipLabel] = [
          "Follower, muted",
          "This user follows you, and you have muted them",
        ];
      else if (profile.isFollowing)
        [label, tooltipLabel] = [
          "Following, muted",
          "You follow this user and you have muted them",
        ];
      else label = "Muted";
    } else {
      if (profile.isFollower && profile.isFollowing)
        [label, tooltipLabel] = [
          "Mutual",
          "You and this user follow each other",
        ];
      else if (profile.isFollower)
        [label, tooltipLabel] = ["Follower", "This user follows you"];
      else if (profile.isFollowing)
        [label, tooltipLabel] = ["Following", "You follow this user"];
    }
  }

  return (
    <Group position="apart" noWrap spacing={1}>
      <Tooltip label={tooltipLabel}>
        <Text sx={{ whiteSpace: "nowrap" }}>{label}</Text>
      </Tooltip>
      <ActionMenu
        target={
          <ActionIcon>
            <IconSettings size={16} />
          </ActionIcon>
        }
        users={[profile]}
        refreshSearch={refreshSearch}
        lists={lists}
        refreshLists={refreshLists}
        listsLoading={listsLoading}
      />
    </Group>
  );
};
