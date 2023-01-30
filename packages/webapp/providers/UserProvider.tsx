import { useSupabaseClient } from "@supabase/auth-helpers-react";
import { createContext, useContext, useEffect, useState } from "react";
import { getUserDetails, UserDetails } from "../utils/users";

const UserContext = createContext<{
  user: UserDetails;
  loading: boolean;
  refresh: () => void;
}>({
  user: null,
  loading: false,
  refresh: () => {},
});

export const UserProvider = ({ children }) => {
  const [user, setUser] = useState<UserDetails>(null);
  const [loading, setLoading] = useState(false);
  const [randomFloat, setRandomFloat] = useState(0);
  const supabase = useSupabaseClient();

  // Load user details
  useEffect(() => {
    const loadUserDetails = async () => {
      setLoading(true);

      // Get user details from database
      const user = await getUserDetails(supabase);
      setUser(user);
      setLoading(false);
    };
    loadUserDetails();
  }, [supabase, randomFloat]);

  return (
    <UserContext.Provider
      value={{
        user,
        loading,
        refresh: () => setRandomFloat(Math.random()),
      }}
    >
      {children}
    </UserContext.Provider>
  );
};

export const useUser = () => useContext(UserContext);
