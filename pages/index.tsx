import { Group, List, Stack, TextInput } from "@mantine/core";
import { getHotkeyHandler } from "@mantine/hooks";
import { useEffect, useState } from "react";

const Home = () => {
  const [followedByAll, setFollowedByAll] = useState<string[]>([]);
  const [followerOfAll, setFollowerOfAll] = useState<string[]>([]);

  const [followedByInput, setFollowedByInput] = useState("");
  const [followerOfInput, setFollowerOfInput] = useState("");

  const handleFollowedByEnter = () => {
    if (followedByInput.length) {
      setFollowedByAll([...followedByAll, followedByInput]);
      setFollowedByInput("");
    }
  };

  const handleFollowerOfEnter = () => {
    if (followerOfInput.length) {
      setFollowerOfAll([...followerOfAll, followerOfInput]);
      setFollowerOfInput("");
    }
  };

  useEffect(() => {
    console.log(followedByAll, followerOfAll);
  }, [followedByAll, followerOfAll]);

  return (
    <Stack>
      <List>
        {followedByAll.map((x) => (
          <List.Item key={x}>followed by: {x}</List.Item>
        ))}
        {followerOfAll.map((x) => (
          <List.Item key={x}>follower of: {x}</List.Item>
        ))}
      </List>
      <Group>
        <TextInput
          label="Followed by"
          value={followedByInput}
          onChange={(event) => setFollowedByInput(event.currentTarget.value)}
          onKeyDown={getHotkeyHandler([["Enter", handleFollowedByEnter]])}
        />
        <TextInput
          label="Follower of"
          value={followerOfInput}
          onChange={(event) => setFollowerOfInput(event.currentTarget.value)}
          onKeyDown={getHotkeyHandler([["Enter", handleFollowerOfEnter]])}
        />
      </Group>
    </Stack>
  );
};

export default Home;
