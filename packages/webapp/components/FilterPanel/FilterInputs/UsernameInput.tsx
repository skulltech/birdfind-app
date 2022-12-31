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
} from "@tabler/icons";
import { useEffect, useState } from "react";
import axios from "axios";
import {
  FilterInputProps,
  parseTwitterProfile,
  TwitterProfile,
} from "../../../utils/helpers";
import { useTwipsSearch } from "../../../providers/TwipsSearchProvider";
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

export const UsernameInput = ({ direction, label }: UsernameInputProps) => {
  const [username, setUsername] = useState("");
  const { addFilters } = useTwipsSearch();
  const supabase = useSupabaseClient();
  const [autocompleteOptions, setAutocompleteOptions] = useState([]);
  const [addFiltersLoading, setAddFiltersLoading] = useState(false);
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
      const { data, error } = await supabase
        .from("twitter_profile")
        .select("username")
        .like("username", `${username}%`)
        .limit(5);
      if (error) throw error;

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

      // Lookup user on Twips
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
    setAddFiltersLoading(true);
    await addFilters({
      [direction == "followers" ? "followerOf" : "followedBy"]: [username],
    });
    setUsername("");
    setAddFiltersLoading(false);
  };

  return (
    <Stack spacing={2}>
      <Text>{label}</Text>

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
                  ? false
                  : "User does not exist"
                : "Username is not valid"
              : false
          }
          rightSection={
            lookupLoading ? (
              <Loader size="xs" />
            ) : valid ? (
              user ? (
                <IconCircleCheck size={20} color="green" />
              ) : (
                <IconAlertCircle size={20} color="red" />
              )
            ) : null
          }
        />
        {valid && user && <Avatar src={user.profileImageUrl} radius="xl" />}
        {addFiltersLoading ? (
          <Loader size="md" />
        ) : (
          <ActionIcon
            size="lg"
            variant="default"
            disabled={!valid || !user}
            onClick={handleSubmit}
          >
            <IconArrowNarrowRight size={16} />
          </ActionIcon>
        )}
      </Group>
    </Stack>
  );
};
