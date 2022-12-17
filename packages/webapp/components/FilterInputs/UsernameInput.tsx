import {
  ActionIcon,
  Autocomplete,
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
import { FilterInputProps } from "../../utils/helpers";
import { lookupTwips } from "../../utils/twips";
import { useTwips } from "../TwipsProvider";

interface UsernameInputProps extends FilterInputProps {
  direction: "followers" | "following";
}

export const UsernameInput = ({ direction, label }: UsernameInputProps) => {
  const [username, setUsername] = useState("");
  const { addFilters } = useTwips();
  const supabase = useSupabaseClient();
  const [autocompleteOptions, setAutocompleteOptions] = useState([]);

  // Checking if username exists
  const [lookupLoading, setLookupLoading] = useState(false);
  // Username is a valid username acc. to the rules
  const [valid, setValid] = useState(false);
  // Username actually exists
  const [exists, setExists] = useState(false);

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
      if (!valid || !Boolean(username.length)) {
        setExists(false);
        return;
      }

      setLookupLoading(true);
      setExists(false);

      // Lookup user on Twips
      try {
        const user = await lookupTwips(username);
        if (user) setExists(true);
      } catch (error) {
        console.log(error);
        showNotification({
          title: "Error",
          message: "Some error ocurred",
          color: "red",
        });
        setExists(false);
      }

      setLookupLoading(false);
    };

    lookupUsername();
  }, [username, valid]);

  return (
    <Stack spacing="xs">
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
                ? exists
                  ? false
                  : "User does not exist"
                : "Username is not valid"
              : false
          }
          rightSection={
            lookupLoading ? (
              <Loader size="xs" />
            ) : valid ? (
              exists ? (
                <IconCircleCheck size={20} color="green" />
              ) : (
                <IconAlertCircle size={20} color="red" />
              )
            ) : null
          }
        />
        <ActionIcon
          size="lg"
          variant="default"
          disabled={!valid || !exists}
          onClick={() => {
            addFilters({
              [direction == "followers" ? "followerOf" : "followedBy"]: [
                username,
              ],
            });
            setUsername("");
          }}
        >
          <IconArrowNarrowRight size={16} />
        </ActionIcon>
      </Group>
    </Stack>
  );
};
