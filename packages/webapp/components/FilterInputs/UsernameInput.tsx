import { Group, Loader, Text, TextInput } from "@mantine/core";
import { getHotkeyHandler } from "@mantine/hooks";
import { showNotification } from "@mantine/notifications";
import { IconAt } from "@tabler/icons";
import { useEffect, useState } from "react";
import { FilterInputProps } from "../../utils/helpers";
import { lookupTwips, updateTwips } from "../../utils/twips";
import { useTwips } from "../TwipsProvider";

// 24 hours
const staleCacheTimeout = 24 * 60 * 60 * 1000;

interface UsernameInputProps extends FilterInputProps {
  direction: "followers" | "following";
}

export const UsernameInput = ({ direction, label }: UsernameInputProps) => {
  const [username, setUsername] = useState("");
  const [valid, setValid] = useState(false);
  const [loading, setLoading] = useState(false);
  const { addFilters } = useTwips();

  // Lookup user on Twips, if required fetch network or schedule job to do so
  const handleSubmit = async () => {
    setLoading(true);

    // Lookup user on Twips
    const user = await lookupTwips(username);

    setLoading(false);

    if (!user) {
      showNotification({
        title: "Error",
        message: "User doesn't exist",
        color: "red",
      });
      return;
    }

    const networkUpdatedAt =
      user[
        direction === "followers" ? "followersUpdatedAt" : "followingUpdatedAt"
      ];

    if (networkUpdatedAt.getTime() === 0) {
      const fetched = await updateTwips(user.id, direction);
      if (!fetched)
        showNotification({
          title: "Sorry",
          message: `We don't have @${username}'s ${direction} fetched in our database yet. A job has been scheduled to do so. Please check again in some time.`,
          color: "red",
        });
      return;
    }

    if (Date.now() - networkUpdatedAt.getTime() > staleCacheTimeout) {
      showNotification({
        title: "Warning",
        message: `@${username}'s ${direction} might be stale. A job has been scheduled to update it.`,
        color: "yellow",
      });
    }

    addFilters({
      [direction == "followers" ? "followerOf" : "followedBy"]: [username],
    });
    setUsername("");
  };

  // Regex check if the username is valid
  useEffect(() => {
    const lowercaseUsername = username.toLowerCase();
    if (
      /^([a-zA-Z0-9_]){4,15}$/.test(username) &&
      !lowercaseUsername.includes("admin") &&
      !lowercaseUsername.includes("twitter")
    )
      setValid(true);
    else setValid(false);
    return;
  }, [username]);

  return (
    <Group noWrap spacing="xs" position="apart">
      <Text>{label}</Text>
      <TextInput
        style={{ width: 180 }}
        value={username}
        icon={<IconAt size={14} />}
        onChange={(event) => setUsername(event.currentTarget.value)}
        error={!valid}
        rightSection={loading && <Loader size="xs" />}
        onKeyDown={getHotkeyHandler([
          [
            "Enter",
            () => {
              if (valid) handleSubmit();
            },
          ],
        ])}
      />
    </Group>
  );
};
