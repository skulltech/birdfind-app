import { SupabaseClient } from "@supabase/supabase-js";
import {
  createContext,
  ReactNode,
  useContext,
  useEffect,
  useState,
} from "react";
import { getUserDetails, UserDetails } from "../utils/supabase";

const TwipsUserContext = createContext<{
  user: UserDetails;
  loading: boolean;
  refresh: () => void;
}>({
  user: null,
  loading: false,
  refresh: () => {},
});

interface TwipsUserProviderProps {
  supabase: SupabaseClient;
  children: ReactNode;
}

export const TwipsUserProvider = ({
  supabase,
  children,
}: TwipsUserProviderProps) => {
  const [user, setUser] = useState<UserDetails>(null);
  const [loading, setLoading] = useState(false);
  const [randomFloat, setRandomFloat] = useState(0);

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
    <TwipsUserContext.Provider
      value={{
        user,
        loading,
        refresh: () => setRandomFloat(Math.random()),
      }}
    >
      {children}
    </TwipsUserContext.Provider>
  );
};

export const useTwipsUser = () => useContext(TwipsUserContext);
