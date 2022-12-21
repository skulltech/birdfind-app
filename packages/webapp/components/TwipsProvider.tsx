import { showNotification } from "@mantine/notifications";
import { SupabaseClient } from "@supabase/supabase-js";
import { Relation, twitterProfileFields } from "@twips/common";
import axios from "axios";
import {
  createContext,
  ReactNode,
  useContext,
  useEffect,
  useState,
} from "react";
import { Filters, parseTwitterProfile, TwitterProfile } from "../utils/helpers";
import {
  getUserDetails,
  searchTwitterProfiles,
  UserDetails,
} from "../utils/supabase";

export const usernameFilters = ["followerOf", "followedBy"];

const TwipsContext = createContext<{
  user: UserDetails;
  filters: Filters;
  addFilters: (arg: Partial<Filters>) => Promise<void>;
  removeFilters: (...args: RemoveFiltersArg[]) => void;
  searchLoading: boolean;
  filtersInvalid: boolean;
  searchResults: TwitterProfile[];
  userLoading: boolean;
}>({
  user: null,
  filters: {},
  addFilters: async () => {},
  removeFilters: () => {},
  searchLoading: false,
  filtersInvalid: false,
  searchResults: [],
  userLoading: false,
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

const isFiltersValid = (username: string, filters: Filters) => {
  return !(
    // None of the essential filters exist
    (
      !(
        filters.followedBy ||
        filters.followerOf ||
        filters.blockedBy ||
        filters.mutedBy
      ) ||
      // Blocked by exists
      (filters.blockedBy &&
        // And it's either more than 1 users or is not logged in one
        (filters.blockedBy.length > 1 || filters.blockedBy[0] != username)) ||
      // Muted by exists
      (filters.mutedBy &&
        // And it's either more than 1 users or is not logged in one
        (filters.mutedBy.length > 1 || filters.mutedBy[0] != username))
    )
  );
};

const updateRelationIfNeeded = async (
  supabase: SupabaseClient,
  username: string,
  relation: Relation
) => {
  const { data, error } = await supabase
    .from("twitter_profile")
    .select(twitterProfileFields.join(","))
    .eq("username", username);
  if (error) throw error;

  const user = parseTwitterProfile(data[0]);

  const relationUpdateAt =
    relation == "followers"
      ? user.followersUpdatedAt
      : relation == "following"
      ? user.followingUpdatedAt
      : relation == "blocking"
      ? user.blockingUpdatedAt
      : relation == "muting"
      ? user.mutingUpdatedAt
      : null;

  if (relationUpdateAt.getTime() === 0)
    await axios.get("/api/twips/update-relation", {
      params: { userId: user.id, relation },
    });
};

export const TwipsProvider = ({ supabase, children }: TwipsProviderProps) => {
  const [user, setUser] = useState<UserDetails>(null);
  const [filters, setFilters] = useState<Filters>({});
  const [userLoading, setUserLoading] = useState(false);

  const [searchLoading, setSearchLoading] = useState(false);
  const [searchResults, setSearchResults] = useState<TwitterProfile[]>([]);
  // Usually indicates that the filters are insufficient
  const [filtersInvalid, setFiltersInvalid] = useState(false);

  // Load user details
  useEffect(() => {
    const loadUserDetails = async () => {
      setUserLoading(true);
      const user = await getUserDetails(supabase);
      setUser(user);
      setUserLoading(false);
    };
    loadUserDetails();
  }, [supabase]);

  // Add filters
  const addFilters = async (arg: Partial<Filters>) => {
    const updatedFilters = { ...filters };

    // Update the filters object
    for (const [filterName, filterValue] of Object.entries(arg)) {
      if (usernameFilters.includes(filterName)) {
        const updatedValue = new Set<string>();

        if (filters[filterName])
          filters[filterName].forEach((item: string) => updatedValue.add(item));

        if (filterValue)
          for (const item of filterValue as string[]) {
            const relation =
              filterName == "followerOf"
                ? "followers"
                : filterName == "followedBy"
                ? "following"
                : filterName == "blockedBy"
                ? "blocking"
                : filterName == "mutedBy"
                ? "muting"
                : null;

            try {
              await updateRelationIfNeeded(supabase, item, relation);
              updatedValue.add(item);
            } catch (error) {
              console.log(error);
              showNotification({
                title: "Sorry",
                message: `It will take some time to fetch @${item}'s ${relation}. Please check in some time`,
                color: "red",
              });
            }
          }

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

  // Search Twitter profiles
  useEffect(() => {
    // Perform search on Supabase
    const handleSearch = async () => {
      setSearchLoading(true);
      const results = await searchTwitterProfiles(supabase, filters);
      setSearchResults(results);
      setSearchLoading(false);
    };

    // If user or filters are invalid
    if (
      !user?.twitter?.username ||
      !isFiltersValid(user.twitter.username, filters)
    ) {
      setFiltersInvalid(true);
      setSearchResults([]);
      return;
    }

    setFiltersInvalid(false);
    handleSearch();
  }, [filters, user?.twitter?.username, supabase]);

  return (
    <TwipsContext.Provider
      value={{
        user,
        filters,
        addFilters,
        removeFilters,
        searchLoading,
        filtersInvalid,
        searchResults,
        userLoading,
      }}
    >
      {children}
    </TwipsContext.Provider>
  );
};

export const useTwips = () => useContext(TwipsContext);
