import {
  ActionIcon,
  Autocomplete,
  Avatar,
  Group,
  Loader,
  Stack,
  Text,
} from "@mantine/core";
import { showNotification } from "@mantine/notifications";
import { useSupabaseClient } from "@supabase/auth-helpers-react";
import {
  IconAlertCircle,
  IconArrowNarrowRight,
  IconAt,
  IconCircleCheck,
  IconLock,
} from "@tabler/icons";
import { useEffect, useState } from "react";
import axios from "axios";
import {
  FilterInputProps,
  parseTwitterProfile,
  TwitterProfile,
} from "../../../utils/helpers";
import { useDebouncedValue } from "@mantine/hooks";

interface UsernameInputProps extends FilterInputProps {
  direction: "followers" | "following";
}

const lookupUser = async (username: string): Promise<TwitterProfile> => {
  const response = await axios.get("/api/twips/lookup-user", {
    params: { username: username },
  });
  if (response.status != 200) throw Error(response.data.message);
  // Check if user doesn't exist
  if (!response.data.profile) return null;

  return parseTwitterProfile(response.data.profile);
};

export const UsernameInput = ({
  direction,
  label,
  addFilters,
}: UsernameInputProps) => {
  const [username, setUsername] = useState("");
  const supabase = useSupabaseClient();
  const [autocompleteOptions, setAutocompleteOptions] = useState([]);
  const [debouncedUsername] = useDebouncedValue(username, 300);

  // Checking if username exists
  const [lookupLoading, setLookupLoading] = useState(false);
  // Username is a valid username acc. to the rules
  const [valid, setValid] = useState(false);
  // Username actually exists
  const [user, setUser] = useState<TwitterProfile>(null);

  // Get username autocomplete options from Supabase
  useEffect(() => {
    const getAutocompleteOptions = async () => {
      const { data } = await supabase
        .from("twitter_profile")
        .select("username")
        .like("username", `${username}%`)
        .limit(5)
        .throwOnError();

      const options = data.map((x) => x.username);
      if (options.length == 1) setAutocompleteOptions([]);
      else setAutocompleteOptions(options);
    };

    getAutocompleteOptions();
  }, [username]);

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
      setUser(null);
      if (!valid || !Boolean(debouncedUsername.length)) return;

      // Lookup user
      setLookupLoading(true);
      try {
        const user = await lookupUser(debouncedUsername);
        if (user) setUser(user);
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

  const handleSubmit = async () => {
    addFilters({
      [direction == "followers" ? "followerOf" : "followedBy"]: new Set([
        username,
      ]),
    });
    setUsername("");
  };

  return (
    <Stack spacing={2}>
      <Text>
        {label} <span style={{ color: "red" }}>*</span>
      </Text>

      <Group align="start" noWrap position="apart">
        <Autocomplete
          data={autocompleteOptions}
          value={username}
          icon={<IconAt size={14} />}
          onChange={setUsername}
          error={
            Boolean(username.length)
              ? lookupLoading
                ? false
                : valid
                ? user
                  ? user.protected
                    ? "Accout is private"
                    : false
                  : "User does not exist"
                : "Username is not valid"
              : false
          }
          rightSection={
            lookupLoading ? (
              <Loader size="xs" />
            ) : valid ? (
              user ? (
                user.protected ? (
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
        {valid && user && <Avatar src={user.profileImageUrl} radius="xl" />}
        <ActionIcon
          size="lg"
          variant="default"
          disabled={!valid || !user || user.protected}
          onClick={handleSubmit}
        >
          <IconArrowNarrowRight size={16} />
        </ActionIcon>
      </Group>
    </Stack>
  );
};
