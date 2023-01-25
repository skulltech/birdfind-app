import { Button, Loader, Stack, TextInput } from "@mantine/core";
import { showNotification } from "@mantine/notifications";
import {
  IconAlertCircle,
  IconArrowNarrowRight,
  IconAt,
  IconCircleCheck,
  IconLock,
} from "@tabler/icons";
import { useEffect, useState } from "react";
import axios from "axios";
import { parseTwitterProfile, TwitterProfile } from "../../utils/helpers";
import { useDebouncedValue } from "@mantine/hooks";
import { UserProfileCard } from "../UserProfileCard";

type MinimalProfile = {
  id: BigInt;
  username: string;
};

interface UsernameFormProps {
  onSubmit: (profile: MinimalProfile) => void;
}

const lookupUser = async (username: string): Promise<TwitterProfile> => {
  const response = await axios.get("/api/birdfind/lookup-user", {
    params: { username: username },
  });
  if (response.status != 200) throw Error(response.data.message);
  // Check if user doesn't exist
  if (!response.data.profile) return null;

  return parseTwitterProfile(response.data.profile);
};

export const UsernameForm = ({ onSubmit }: UsernameFormProps) => {
  const [username, setUsername] = useState("");
  const [debouncedUsername] = useDebouncedValue(username, 300);

  // Checking if username exists
  const [lookupLoading, setLookupLoading] = useState(false);
  // Username is a valid username acc. to the rules
  const [valid, setValid] = useState(false);
  // Username actually exists
  const [profile, setProfile] = useState<TwitterProfile>(null);

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
  }, [username]);

  // Check whether username exists
  useEffect(() => {
    const lookupUsername = async () => {
      setProfile(null);
      if (!valid || !Boolean(debouncedUsername.length)) return;

      // Lookup user
      setLookupLoading(true);
      try {
        const user = await lookupUser(debouncedUsername);
        if (user) setProfile(user);
      } catch (error) {
        showNotification({
          title: "Error",
          message: "Some error ocurred",
          color: "red",
        });
      }
      setLookupLoading(false);
    };

    lookupUsername();
  }, [debouncedUsername, valid]);

  return (
    <Stack spacing="sm" p="sm">
      <TextInput
        value={username}
        label="Username"
        withAsterisk
        icon={<IconAt size={14} />}
        onChange={(event) => setUsername(event.currentTarget.value)}
        error={
          Boolean(username.length)
            ? lookupLoading
              ? false
              : valid
              ? profile
                ? profile.protected
                  ? "Accout is private"
                  : false
                : "User does not exist"
              : "Username is not valid"
            : false
        }
        placeholder="Twitter username"
        rightSection={
          lookupLoading ? (
            <Loader size="xs" />
          ) : valid ? (
            profile ? (
              profile.protected ? (
                <IconLock size={20} color="red" />
              ) : (
                <IconCircleCheck size={20} color="green" />
              )
            ) : (
              <IconAlertCircle size={20} color="red" />
            )
          ) : null
        }
      />
      {valid && profile && !profile.protected && (
        <UserProfileCard {...{ profile }} />
      )}
      <Button
        variant="default"
        disabled={!valid || !profile || profile.protected}
        onClick={() => {
          onSubmit({ id: profile.id, username: profile.username });
        }}
        rightIcon={<IconArrowNarrowRight size={18} stroke={2} />}
      >
        Add query
      </Button>
    </Stack>
  );
};
