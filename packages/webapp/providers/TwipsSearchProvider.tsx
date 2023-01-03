import { showNotification } from "@mantine/notifications";
import { SupabaseClient } from "@supabase/supabase-js";
import { addLookupRelationJob, twitterProfileColumns } from "@twips/common";
import {
  createContext,
  Dispatch,
  ReactNode,
  SetStateAction,
  useContext,
  useEffect,
  useState,
} from "react";
import { Filters, parseTwitterProfile } from "../utils/helpers";
import { SearchResult, searchTwitterProfiles } from "../utils/supabase";
import { useTwipsUser } from "./TwipsUserProvider";

export const usernameFilters = ["followerOf", "followedBy"];

type Relation = "followers" | "following" | "blocking" | "muting";

const TwipsSearchContext = createContext<{
  // Filters
  filters: Filters;
  addFilters: (arg: Partial<Filters>) => Promise<void>;
  removeFilters: (...args: RemoveFiltersArg[]) => void;
  filtersInvalid: boolean;
  // Search results and pagination
  results: SearchResult[];
  count: number;
  pageIndex: number;
  setPageIndex: Dispatch<SetStateAction<number>>;
  // Loading and refresh
  loading: boolean;
  refresh: (silent: boolean) => void;
}>({
  filters: {},
  addFilters: async () => {},
  removeFilters: () => {},
  loading: false,
  filtersInvalid: false,
  results: [],
  count: 0,
  pageIndex: 0,
  setPageIndex: () => {},
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
    .select(twitterProfileColumns.join(","))
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

  const [filters, setFilters] = useState<Filters>({});
  const [pageIndex, setPageIndex] = useState(0);
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState<SearchResult[]>([]);

  const [count, setCount] = useState(0);
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
              await lookupRelationIfNeeded(supabase, item, relation);
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

  // Perform search on Supabase
  const handleSearch = async (silent: boolean) => {
    if (!silent) setLoading(true);
    const { results, count } = await searchTwitterProfiles({
      supabase,
      userTwitterId: user.twitter.id,
      filters,
      pageIndex,
    });
    setResults(results);
    setCount(count);
    setLoading(false);
  };

  // Check if filters are invalid and search loudly if so
  useEffect(() => {
    const foo = async () => {
      if (!isFiltersValid(user.twitter.username, filters)) {
        setFiltersInvalid(true);
        setResults([]);
        setCount(0);
      } else setFiltersInvalid(false);

      await handleSearch(false);
      setPageIndex(0);
    };

    foo();
  }, [filters]);

  // Search loudly on page change
  useEffect(() => {
    handleSearch(false);
  }, [pageIndex]);

  return (
    <TwipsSearchContext.Provider
      value={{
        filters,
        addFilters,
        removeFilters,
        loading,
        filtersInvalid,
        results,
        count,
        refresh: handleSearch,
        pageIndex,
        setPageIndex,
      }}
    >
      {children}
    </TwipsSearchContext.Provider>
  );
};

export const useTwipsSearch = () => useContext(TwipsSearchContext);
