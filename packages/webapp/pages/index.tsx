import { useEffect, useState } from "react";
import { searchTwitterProfiles, TwitterProfile } from "@twips/lib";
import { Skeleton } from "@mantine/core";
import { UserTable } from "../components/UserTable/UserTable";
import { useSupabaseClient } from "@supabase/auth-helpers-react";
import { useTwips } from "../components/TwipsProvider";

const Home = () => {
  const { filters } = useTwips();
  const [searchLoading, setSearchLoading] = useState(false);
  const [users, setUsers] = useState<TwitterProfile[]>([]);
  const [selectedUsers, setSelectedUsers] = useState<TwitterProfile[]>([]);
  const supabase = useSupabaseClient();

  useEffect(() => {
    const handleSearch = async () => {
      console.log("searching");
      setSearchLoading(true);
      try {
        const users = await searchTwitterProfiles(supabase, filters);
        setUsers(users);
      } catch (error) {
        console.log(error);
      }
      setSearchLoading(false);
    };

    handleSearch();
  }, [filters, supabase]);

  return (
    <Skeleton visible={searchLoading}>
      <UserTable
        users={users}
        selectedUsers={selectedUsers}
        setSelectedUsers={setSelectedUsers}
      />
    </Skeleton>
  );
};

export default Home;
