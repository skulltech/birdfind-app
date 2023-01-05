import { useEffect, useMemo, useState } from "react";
import { UserTable } from "../components/UserTable/UserTable";
import { Group } from "@mantine/core";
import { FilterPanel } from "../components/FilterPanel/FilterPanel";
import { useUser } from "../providers/UserProvider";
import { Filters, Job, parseTwitterProfile } from "../utils/helpers";
import { SupabaseClient } from "@supabase/supabase-js";
import {
  SearchResult,
  searchTwitterProfiles,
  UserDetails,
} from "../utils/supabase";
import { addLookupRelationJob, twitterProfileColumns } from "@twips/common";
import { useDebouncedValue } from "@mantine/hooks";
import { useSupabaseClient } from "@supabase/auth-helpers-react";
import { useJobs } from "../providers/JobsProvider";

type Relation = "followers" | "following" | "blocking" | "muting";

// Remove filters
export type RemoveFiltersArg =
  | {
      name: keyof Omit<Filters, "followerOf" | "followedBy">;
    }
  | {
      name: keyof Pick<Filters, "followerOf" | "followedBy">;
      value: Set<string>;
    };

const lookupRelationIfNeeded = async (
  supabase: SupabaseClient,
  user: UserDetails,
  target: string,
  relation: Relation
) => {
  const { data } = await supabase
    .from("twitter_profile")
    .select(twitterProfileColumns.join(","))
    .eq("username", target)
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

const Search = () => {
  const { user } = useUser();
  const { jobsUpdatedMarker } = useJobs();
  const supabase = useSupabaseClient();

  // Search inputs
  const [filters, setFilters] = useState<Filters>({});
  const filtersSufficient = useMemo(
    () =>
      filters.followedBy?.size > 0 ||
      filters.followerOf?.size > 0 ||
      filters.blockedByMe ||
      filters.mutedByMe,
    [filters]
  );
  const [pageIndex, setPageIndex] = useState(0);

  // Debounced search inputs
  const [debouncedFilters] = useDebouncedValue(filters, 200);
  const [debouncedPageIndex] = useDebouncedValue(pageIndex, 200);

  // Whether to show loading state
  const [loading, setLoading] = useState(false);
  // Search results
  const [results, setResults] = useState<SearchResult[]>([]);
  const [count, setCount] = useState(0);

  // Indicates whether there are jobs associated with the search
  const [searchInProgress, setSearchInProgress] = useState(false);
  const { jobs } = useJobs();

  useEffect(() => {
    const isMetadataMatching = (metadata: Job["metadata"]) =>
      filters.blockedByMe && metadata.relation == "blocking"
        ? true
        : filters.blockedByMe && metadata.relation == "blocking"
        ? true
        : filters.followedBy &&
          metadata.relation == "following" &&
          filters.followedBy.has(metadata.username)
        ? true
        : filters.followerOf &&
          metadata.relation == "followers" &&
          filters.followerOf.has(metadata.username)
        ? true
        : false;

    setSearchInProgress(
      jobs.filter(
        (job) =>
          job.name == "lookup-relation" && isMetadataMatching(job.metadata)
      ).length > 0
    );
  }, [jobs, filters]);

  // Reducer function for adding filters
  const addFilters = (arg: Filters) =>
    setFilters((filters) => {
      const updatedFilters = { ...filters };

      for (const [filterName, filterValue] of Object.entries(arg)) {
        if (filterValue !== undefined && filterValue !== null) {
          if (["followerOf", "followedBy"].includes(filterName)) {
            if (updatedFilters[filterName])
              (filterValue as Set<string>).forEach((username: string) =>
                updatedFilters[filterName].add(username)
              );
            else updatedFilters[filterName] = filterValue;
            // Single values, i.e. not set
          } else updatedFilters[filterName] = filterValue;
        }
      }

      return updatedFilters;
    });

  // Reducer function for removing filters
  const removeFilters = (...args: RemoveFiltersArg[]) =>
    setFilters((filters) => {
      const updatedFilters = { ...filters };

      for (const arg of args)
        if (arg.name == "followerOf" || arg.name == "followedBy") {
          arg.value.forEach((username: string) =>
            updatedFilters[arg.name].delete(username)
          );
          if (updatedFilters[arg.name].size == 0)
            delete updatedFilters[arg.name];
        } else delete updatedFilters[arg.name];

      return updatedFilters;
    });

  // Add lookup-relation jobs if needed
  useEffect(() => {
    if (!user?.twitter) return;

    for (const [filterName, filterValue] of Object.entries(debouncedFilters)) {
      if (filterValue !== undefined && filterValue !== null) {
        if (
          ["followerOf", "followedBy", "blockedByMe", "mutedByMe"].includes(
            filterName
          )
        ) {
          const relation =
            filterName == "followerOf"
              ? "followers"
              : filterName == "followedBy"
              ? "following"
              : filterName == "blockedByMe"
              ? "blocking"
              : filterName == "mutedByMe"
              ? "muting"
              : null;

          if (["followerOf", "followedBy"].includes(filterName))
            (filterValue as Set<string>).forEach((username) =>
              lookupRelationIfNeeded(supabase, user, username, relation)
            );
          else
            lookupRelationIfNeeded(
              supabase,
              user,
              user.twitter.username,
              relation
            );
        }
      }
    }
  }, [debouncedFilters, user]);

  // Perform search on Supabase
  const handleSearch = async (silent?: boolean) => {
    if (!filtersSufficient || !user?.twitter) {
      setResults([]);
      setCount(0);
      return;
    }
    if (!silent) setLoading(true);

    const { results, count } = await searchTwitterProfiles({
      supabase,
      userTwitterId: user.twitter.id,
      filters: debouncedFilters,
      pageIndex: debouncedPageIndex,
    });
    setResults(results);
    setCount(count);
    setLoading(false);
  };

  // Search on filter change
  useEffect(() => {
    handleSearch();
    setPageIndex(0);
  }, [debouncedFilters]);

  // Search on pagination change
  useEffect(() => {
    handleSearch();
  }, [debouncedPageIndex]);

  // Refresh silently on job updates
  useEffect(() => {
    handleSearch(true);
  }, [jobsUpdatedMarker]);

  return (
    <Group noWrap spacing={0} pt="sm" align="start">
      <FilterPanel {...{ filters, addFilters, removeFilters }} />
      <UserTable
        {...{
          results,
          count,
          refresh: handleSearch,
          pageIndex,
          loading,
          filtersSufficient,
          setPageIndex,
          searchInProgress,
        }}
      />
    </Group>
  );
};

export default Search;
