import { useEffect, useState } from "react";
import { UserTable } from "../components/UserTable/UserTable";
import { useSupabaseClient } from "@supabase/auth-helpers-react";
import { useTwips } from "../components/TwipsProvider";
import {
  parseTwitterProfile,
  TwitterProfile,
  twitterProfileFields,
} from "../utils/helpers";
import { searchTwitterProfiles } from "../utils/supabase";
import { updateTwips } from "../utils/twips";
import { showNotification } from "@mantine/notifications";
import { Skeleton } from "@mantine/core";

const Home = () => {
  const { filters, user, addFilters } = useTwips();
  const [users, setUsers] = useState<TwitterProfile[]>([]);
  const [selectedUsers, setSelectedUsers] = useState<TwitterProfile[]>([]);
  const supabase = useSupabaseClient();
  // Updating relations using job-queue if needed
  const [updateLoading, setUpdateLoading] = useState(false);

  // Add user's following on first load of page
  useEffect(() => {
    if (user?.twitter?.username)
      addFilters({ followedBy: [user.twitter.username] });
  }, [user]);

  // Update relation using job-queue if needed
  useEffect(() => {}, [filters]);

  // Search Twitter profiles
  useEffect(() => {
    const handleSearch = async () => {
      // If no filters, show 0 users
      if (Object.keys(filters).length == 0) {
        setUsers([]);
        return;
      }

      const usernamesToCheck = [
        ...(filters.followedBy ?? []),
        ...(filters.followerOf ?? []),
      ];
      const { data, error } = await supabase
        .from("twitter_profile")
        .select(twitterProfileFields.join(","))
        .in("username", usernamesToCheck);
      if (error) throw error;

      const usersToCheck: Record<string, TwitterProfile> = data
        .map((x) => parseTwitterProfile(x))
        .reduce((prev, curr) => {
          return { ...prev, [curr.username]: curr };
        }, {});

      for (const [username, userToCheck] of Object.entries(usersToCheck)) {
        if (filters.followedBy?.includes(username)) {
          if (userToCheck.followingUpdatedAt.getTime() === 0) {
            setUpdateLoading(true);

            const fetched = await updateTwips(userToCheck.id, "following");
            if (!fetched) {
              showNotification({
                title: "Sorry",
                message: `We don't have @${username}'s following fetched in our database yet. A job has been scheduled to do so. Please check again in some time.`,
                color: "red",
              });
            }
          }
        }
      }

      setUpdateLoading(false);

      const users = await searchTwitterProfiles(supabase, filters);
      setUsers(users);
    };

    handleSearch();
  }, [filters]);

  return updateLoading ? (
    <>
      <Skeleton height={8} radius="xl" />
      <Skeleton height={8} radius="xl" />
      <Skeleton height={8} radius="xl" />
      <Skeleton height={8} radius="xl" />
    </>
  ) : (
    <UserTable
      users={users}
      selectedUsers={selectedUsers}
      setSelectedUsers={setSelectedUsers}
    />
  );
};

export default Home;
