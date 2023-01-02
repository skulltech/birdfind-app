import { Badge, Group } from "@mantine/core";
import { SearchResult } from "../../utils/supabase";

type RelationsCellProps = {
  profile: SearchResult;
};

export const RelationsCell = ({ profile }: RelationsCellProps) => {
  return (
    <Group>
      {profile.isFollower && <Badge>Follower</Badge>}
      {profile.isFollowing && <Badge>Following</Badge>}
      {profile.isBlocked && <Badge>Blocked</Badge>}
      {profile.isMuted && <Badge>Muted</Badge>}
    </Group>
  );
};
