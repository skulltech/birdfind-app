import { useEffect, useState } from "react";
import { searchTwitterProfiles, TwitterProfile } from "@twips/lib";
import { UserTable } from "../components/UserTable/UserTable";
import { useSupabaseClient } from "@supabase/auth-helpers-react";
import { useTwips } from "../components/TwipsProvider";

const Home = () => {
  const { filters, userIds, user, addFilters } = useTwips();
  const [users, setUsers] = useState<TwitterProfile[]>([]);
  const [selectedUsers, setSelectedUsers] = useState<TwitterProfile[]>([]);
  const supabase = useSupabaseClient();

  useEffect(() => {
    if (user?.twitter?.username)
      addFilters({ followedBy: [user.twitter.username] });
  }, [user]);

  useEffect(() => {
    const handleSearch = async () => {
      // If no filters, show 0 users
      if (Object.keys(filters).length == 0) {
        setUsers([]);
        return;
      }

      try {
        // Create SupabaseFilters object from Filters object
        const supabaseFilters = {
          ...filters,
          followedBy: filters.followedBy
            ? filters.followedBy.map((x) => userIds[x])
            : null,
          followerOf: filters.followerOf
            ? filters.followerOf.map((x) => userIds[x])
            : null,
          blockedBy: filters.blockedByUser ? [user.twitter.id] : null,
          mutedBy: filters.mutedByUser ? [user.twitter.id] : null,
        };
        delete supabaseFilters["blockedByUser"];
        delete supabaseFilters["mutedByUser"];

        // Perform search
        const users = await searchTwitterProfiles(supabase, supabaseFilters);
        setUsers(users);
      } catch (error) {
        console.log(error);
      }
    };

    handleSearch();
  }, [filters, userIds]);

  return (
    <UserTable
      users={users}
      selectedUsers={selectedUsers}
      setSelectedUsers={setSelectedUsers}
    />
  );
};

export default Home;
