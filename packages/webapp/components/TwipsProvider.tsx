import { SupabaseClient } from "@supabase/supabase-js";
import axios from "axios";
import {
  createContext,
  ReactNode,
  useContext,
  useEffect,
  useState,
} from "react";
import { Filters } from "../utils/helpers";
import { getUserDetails, UserDetails } from "../utils/supabase";

export const usernameFilters = ["followerOf", "followedBy"];

const TwipsContext = createContext<{
  user: UserDetails;
  filters: Filters;
  addFilters: (arg: Partial<Filters>) => void;
  removeFilters: (...args: RemoveFiltersArg[]) => void;
}>({
  user: null,
  filters: {},
  addFilters: () => {},
  removeFilters: () => {},
});

interface TwipsProviderProps {
  supabase: SupabaseClient;
  children: ReactNode;
}

// Remove filters
export type RemoveFiltersArg =
  | keyof Omit<Filters, "followedBy" | "followerOf" | "mutedBy" | "blockedBy">
  | Pick<Filters, "followedBy">
  | Pick<Filters, "followerOf">
  | Pick<Filters, "mutedBy">
  | Pick<Filters, "blockedBy">;

export const TwipsProvider = ({ supabase, children }: TwipsProviderProps) => {
  const [user, setUser] = useState<UserDetails>(null);
  const [filters, setFilters] = useState<Filters>({});

  // Load user details
  useEffect(() => {
    const loadUserDetails = async () => {
      const user = await getUserDetails(supabase);
      setUser(user);
      if (user && user.twitter) await axios.get("/api/twips/add-crons");
    };
    loadUserDetails();
  }, [supabase]);

  // Add filters
  const addFilters = (arg: Partial<Filters>) => {
    const updatedFilters = { ...filters };

    for (const [filterName, filterValue] of Object.entries(arg)) {
      if (usernameFilters.includes(filterName)) {
        const updatedValue = new Set<string>();

        if (filters[filterName])
          filters[filterName].forEach((item: string) => updatedValue.add(item));

        if (filterValue)
          (filterValue as string[]).forEach((item: string) =>
            updatedValue.add(item)
          );

        if (updatedValue.size)
          updatedFilters[filterName] = Array.from(updatedValue);
      } else {
        if (filterValue) updatedFilters[filterName] = filterValue;
        else delete updatedFilters[filterName];
      }
    }

    setFilters(updatedFilters);
  };

  const removeFilters = (...args: RemoveFiltersArg[]) => {
    const updatedFilters = { ...filters };

    for (const arg of args) {
      if (typeof arg == "string") delete updatedFilters[arg];
      else {
        if (Object.keys(arg).length == 0) break;

        const [filterName, usernames] = Object.entries(arg)[0];
        const updatedValue = new Set<string>(filters[filterName]);
        if (usernames)
          usernames.forEach((item: string) => updatedValue.delete(item));

        if (updatedValue.size)
          updatedFilters[filterName] = Array.from(updatedValue);
        else delete updatedFilters[filterName];
      }
    }

    setFilters(updatedFilters);
  };

  return (
    <TwipsContext.Provider value={{ user, filters, addFilters, removeFilters }}>
      {children}
    </TwipsContext.Provider>
  );
};

export const useTwips = () => useContext(TwipsContext);
