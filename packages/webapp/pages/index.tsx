import { useEffect, useState } from "react";
import { UserTable } from "../components/UserTable/UserTable";
import { useTwips } from "../components/TwipsProvider";
import { TwitterProfile } from "../utils/helpers";
import { LoadingOverlay } from "@mantine/core";

const Home = () => {
  const { user, addFilters, searchResults, searchLoading } = useTwips();
  const [selectedUsers, setSelectedUsers] = useState<TwitterProfile[]>([]);

  // Add user's following on first load of page
  useEffect(() => {
    if (user?.twitter?.username)
      addFilters({ followedBy: [user.twitter.username] });
  }, [user]);

  return (
    <div style={{ position: "relative" }}>
      <LoadingOverlay visible={searchLoading} overlayBlur={2} />
      <UserTable
        users={searchResults}
        selectedUsers={selectedUsers}
        setSelectedUsers={setSelectedUsers}
      />
    </div>
  );
};

export default Home;
