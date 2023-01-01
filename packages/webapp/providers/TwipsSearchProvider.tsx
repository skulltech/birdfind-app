import { showNotification } from "@mantine/notifications";
import { SupabaseClient } from "@supabase/supabase-js";
import {
  addLookupRelationJob,
  Relation,
  twitterProfileFields,
} from "@twips/common";
import {
  createContext,
  ReactNode,
  useContext,
  useEffect,
  useState,
} from "react";
import { Filters, parseTwitterProfile, TwitterProfile } from "../utils/helpers";
import { searchTwitterProfiles } from "../utils/supabase";
import { useTwipsJobs } from "./TwipsJobsProvider";
import { useTwipsUser } from "./TwipsUserProvider";

export const usernameFilters = ["followerOf", "followedBy"];

const TwipsSearchContext = createContext<{
  filters: Filters;
  addFilters: (arg: Partial<Filters>) => Promise<void>;
  removeFilters: (...args: RemoveFiltersArg[]) => void;
  loading: boolean;
  filtersInvalid: boolean;
  results: TwitterProfile[];
  refresh: () => void;
}>({
  filters: {},
  addFilters: async () => {},
  removeFilters: () => {},
  loading: false,
  filtersInvalid: false,
  results: [],
  refresh: () => {},
});

interface TwipsSearchProviderProps {
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

const lookupRelationIfNeeded = async (
  supabase: SupabaseClient,
  username: string,
  relation: Relation
) => {
  const {
    data: { user },
  } = await supabase.auth.getUser();
  const { data } = await supabase
    .from("twitter_profile")
    .select(twitterProfileFields.join(","))
    .eq("username", username)
    .throwOnError();

  const twitterProfile = parseTwitterProfile(data[0]);

  const relationUpdateAt =
    relation == "followers"
      ? twitterProfile.followersUpdatedAt
      : relation == "following"
      ? twitterProfile.followingUpdatedAt
      : relation == "blocking"
      ? twitterProfile.blockingUpdatedAt
      : relation == "muting"
      ? twitterProfile.mutingUpdatedAt
      : null;

  // 24 hours ago
  const cacheTimeout = 24 * 3600 * 1000;
  // Relation was updated more than cacheTimeout times ago
  if (Date.now() - relationUpdateAt.getTime() > cacheTimeout) {
    await addLookupRelationJob({
      supabase,
      userId: user.id,
      targetTwitterId: twitterProfile.id,
      relation,
      // Higher priority if it was never updated
      priority: relationUpdateAt.getTime() === 0 ? 200000 : 100000,
    });
    return true;
  }
  return false;
};

export const TwipsSearchProvider = ({
  supabase,
  children,
}: TwipsSearchProviderProps) => {
  // Get user details from user provider
  const { user } = useTwipsUser();
  const { refresh } = useTwipsJobs();

  const [filters, setFilters] = useState<Filters>({});
  const [randomFloat, setRandomFloat] = useState(0);

  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState<TwitterProfile[]>([]);
  // Usually indicates that the filters are insufficient
  const [filtersInvalid, setFiltersInvalid] = useState(false);

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
              const jobAdded = await lookupRelationIfNeeded(
                supabase,
                item,
                relation
              );
              if (jobAdded) refresh();
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
      setLoading(true);
      const results = await searchTwitterProfiles(supabase, filters);
      setResults(results);
      setLoading(false);
    };

    // If user or filters are invalid
    if (
      !user?.twitter?.username ||
      !isFiltersValid(user.twitter.username, filters)
    ) {
      setFiltersInvalid(true);
      setResults([]);
      return;
    }

    setFiltersInvalid(false);
    handleSearch();
  }, [filters, user?.twitter?.username, supabase, randomFloat]);

  return (
    <TwipsSearchContext.Provider
      value={{
        filters,
        addFilters,
        removeFilters,
        loading,
        filtersInvalid,
        results,
        refresh: () => setRandomFloat(Math.random()),
      }}
    >
      {children}
    </TwipsSearchContext.Provider>
  );
};

export const useTwipsSearch = () => useContext(TwipsSearchContext);
