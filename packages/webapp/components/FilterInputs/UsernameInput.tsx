import { Autocomplete, Group, Loader, Text, TextInput } from "@mantine/core";
import { getHotkeyHandler } from "@mantine/hooks";
import { showNotification } from "@mantine/notifications";
import { useSupabaseClient } from "@supabase/auth-helpers-react";
import { IconAt } from "@tabler/icons";
import { useEffect, useState } from "react";
import { FilterInputProps, TwitterProfile } from "../../utils/helpers";
import { lookupTwips, updateTwips } from "../../utils/twips";
import { useTwips } from "../TwipsProvider";

interface UsernameInputProps extends FilterInputProps {
  direction: "followers" | "following";
}

export const UsernameInput = ({ direction, label }: UsernameInputProps) => {
  const [username, setUsername] = useState("");
  const [valid, setValid] = useState(false);
  const [loading, setLoading] = useState(false);
  const { addFilters, addUserId } = useTwips();
  const supabase = useSupabaseClient();
  const [autocompleteOptions, setAutocompleteOptions] = useState([]);

  // Get username autocomplete options from Supabase
  useEffect(() => {
    const getAutocompleteOptions = async () => {
      const { data, error } = await supabase
        .from("twitter_profile")
        .select("username")
        .like("username", `${username}%`);
      if (error) throw error;

      const options = data.map((x) => x.username);
      setAutocompleteOptions(options);
    };

    getAutocompleteOptions();
  }, [username]);

  // Lookup user on Twips, if required fetch network or schedule job to do so
  const handleSubmit = async () => {
    setLoading(true);

    // Lookup user on Twips
    let user: TwitterProfile;
    try {
      user = await lookupTwips(username);
    } catch (error) {
      console.log(error);
      showNotification({
        title: "Error",
        message: "Some error ocurred",
        color: "red",
      });
      setLoading(false);
      return;
    }

    if (!user) {
      showNotification({
        title: "Error",
        message: "User doesn't exist",
        color: "red",
      });
      setLoading(false);
      return;
    }

    const networkUpdatedAt =
      user[
        direction === "followers" ? "followersUpdatedAt" : "followingUpdatedAt"
      ];

    if (networkUpdatedAt.getTime() === 0) {
      const fetched = await updateTwips(user.id, direction);
      if (!fetched) {
        showNotification({
          title: "Sorry",
          message: `We don't have @${username}'s ${direction} fetched in our database yet. A job has been scheduled to do so. Please check again in some time.`,
          color: "red",
        });
        setLoading(false);
        return;
      }
    }
    setLoading(false);

    addUserId(username, user.id);
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
      <Autocomplete
        style={{ width: 180 }}
        data={autocompleteOptions}
        value={username}
        icon={<IconAt size={14} />}
        onChange={setUsername}
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
