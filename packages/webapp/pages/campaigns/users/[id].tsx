import {
  ActionIcon,
  Button,
  Checkbox,
  createStyles,
  Group,
  LoadingOverlay,
  NativeSelect,
  Pagination,
  ScrollArea,
  Stack,
  Text,
} from "@mantine/core";
import { useSupabaseClient } from "@supabase/auth-helpers-react";
import { IconRefresh } from "@tabler/icons";
import Head from "next/head";
import { useRouter } from "next/router";
import { useEffect, useState } from "react";
import { UserProfileCard } from "../../../components/UserProfileCard";
import { useUser } from "../../../providers/UserProvider";
import { Filters } from "../../../utils/helpers";
import { SearchResult, searchTwitterProfiles } from "../../../utils/supabase";
import decamelize from "decamelize";

// Remove filters
export type RemoveFiltersArg = keyof Filters;

// DayJS import and setup
import dayjs from "dayjs";
import RelativeTime from "dayjs/plugin/relativeTime";
dayjs.extend(RelativeTime);

const useStyles = createStyles((theme) => ({
  header: {
    transition: "box-shadow 150ms ease",

    "&::after": {
      content: '""',
      position: "absolute",
      left: 0,
      right: 0,
      bottom: 0,
      borderBottom: `1px solid ${
        theme.colorScheme === "dark"
          ? theme.colors.dark[3]
          : theme.colors.gray[2]
      }`,
    },
  },

  scrolled: {
    boxShadow: theme.shadows.sm,
  },

  rowSelected: {
    backgroundColor:
      theme.colorScheme === "dark"
        ? theme.fn.rgba(theme.colors[theme.primaryColor][7], 0.2)
        : theme.colors[theme.primaryColor][0],
  },
}));

const largeNumberFormatter = (value: number): string => {
  if (value < 1e3) return value.toString();
  if (value >= 1e3 && value < 1e6)
    return (value / 1e3).toFixed(1).replace(/\.0$/, "") + "k";
  if (value >= 1e6) return (value / 1e6).toFixed(1).replace(/\.0$/, "") + "m";
};

const UserSearch = () => {
  const router = useRouter();
  const { id } = router.query;

  const { classes, cx } = useStyles();
  const [scrolled, setScrolled] = useState(false);

  const [orderBy, setOrderBy] = useState<
    "followersCount" | "followingCount" | "tweetCount"
  >("followersCount");
  const [orderAscending, setOrderAscending] = useState(false);

  const supabase = useSupabaseClient();

  useEffect(() => {
    const fetchCampaign = async () => {
      const { data } = await supabase
        .from("user_campaign")
        .select("*")
        .eq("id", id)
        .throwOnError()
        .maybeSingle();
      console.log(data);
    };

    fetchCampaign();
  }, []);

  const { user } = useUser();

  // Search inputs
  const [filters, setFilters] = useState<Filters>({});
  const [pageIndex, setPageIndex] = useState(0);

  // Whether to show loading state
  const [loading, setLoading] = useState(false);
  // Search results
  const [results, setResults] = useState<SearchResult[]>([]);
  const [count, setCount] = useState(0);

  // Reducer function for adding filters
  const addFilters = (arg: Filters) =>
    setFilters((filters) => {
      const updatedFilters = { ...filters };

      for (const [filterName, filterValue] of Object.entries(arg))
        if (filterValue !== undefined && filterValue !== null)
          updatedFilters[filterName] = filterValue;

      return updatedFilters;
    });

  // Reducer function for removing filters
  const removeFilters = (...args: RemoveFiltersArg[]) =>
    setFilters((filters) => {
      const updatedFilters = { ...filters };
      for (const arg of args) delete updatedFilters[arg];
      return updatedFilters;
    });

  // Perform search on Supabase
  const handleSearch = async (silent?: boolean) => {
    if (!user?.twitter) {
      setResults([]);
      setCount(0);
      return;
    }
    if (!silent) setLoading(true);

    const { results, count } = await searchTwitterProfiles({
      supabase,
      userTwitterId: user.twitter.id,
      filters: { followerOf: ["summitkg"] },
      pageIndex,
      orderBy: decamelize(orderBy),
      orderAscending,
    });
    setResults(results);
    setCount(count);
    setLoading(false);
  };

  // Search and set page to 0
  useEffect(() => {
    handleSearch();
    setPageIndex(0);
  }, [filters, orderBy, orderAscending]);

  // Search on page change
  useEffect(() => {
    handleSearch();
  }, [pageIndex]);

  // Refresh silently on job updates
  // useEffect(() => {
  //   handleSearch(true);
  // }, [jobsUpdatedMarker]);

  return (
    <>
      <Head>
        <title>Search | Birdfind</title>
      </Head>
      <Group noWrap spacing={0} pt="sm" align="start">
        <Stack spacing={0} sx={{ flex: 1 }}>
          <Group position="apart" p="md" className={classes.header}>
            <Group>
              <NativeSelect
                data={[
                  { value: "followersCount", label: "Followers count" },
                  { value: "followingCount", label: "Following count" },
                  { value: "tweetCount", label: "Tweets count" },
                ]}
                value={orderBy}
                onChange={(event) => setOrderBy(event.currentTarget.value)}
                label="Sort by"
                withAsterisk
              />
              <Checkbox
                label="Ascending"
                checked={orderAscending}
                onChange={(event) =>
                  setOrderAscending(event.currentTarget.checked)
                }
              />
            </Group>
            <Group>
              <Text size={14}>
                Showing {Math.min(pageIndex * 100 + 1, count)} -{" "}
                {Math.min((pageIndex + 1) * 100, count)} of {count} results
              </Text>
              <Pagination
                size="sm"
                page={pageIndex + 1}
                onChange={(page) => setPageIndex(page - 1)}
                total={Math.ceil(count / 100)}
              />
              <ActionIcon
                size="sm"
                color="blue"
                onClick={() => handleSearch(false)}
              >
                <IconRefresh />
              </ActionIcon>
            </Group>
          </Group>

          <div style={{ position: "relative" }}>
            <LoadingOverlay visible={loading} overlayBlur={2} />
            <ScrollArea
              sx={{
                height:
                  "calc(100vh - var(--mantine-header-height, 0px) - 54px)",
              }}
              onScrollPositionChange={({ y }) => setScrolled(y !== 0)}
            >
              <table>
                {results.map((result) => (
                  <tr key={result.id.toString()}>
                    <td>
                      <UserProfileCard profile={result} />
                    </td>
                    <td style={{ whiteSpace: "nowrap" }}>
                      <span style={{ fontWeight: "bold", fontSize: "1.2rem" }}>
                        {largeNumberFormatter(result.followersCount)}
                      </span>{" "}
                      followers
                    </td>
                    <td style={{ whiteSpace: "nowrap" }}>
                      <span style={{ fontWeight: "bold", fontSize: "1.2rem" }}>
                        {largeNumberFormatter(result.followingCount)}
                      </span>{" "}
                      following
                    </td>
                    <td style={{ whiteSpace: "nowrap" }}>
                      <span style={{ fontWeight: "bold", fontSize: "1.2rem" }}>
                        {largeNumberFormatter(result.tweetCount)}
                      </span>{" "}
                      tweets
                    </td>
                    <td style={{ whiteSpace: "nowrap" }}>
                      Joined{" "}
                      <span style={{ fontWeight: "bold", fontSize: "1.2rem" }}>
                        {dayjs().to(dayjs(result.userCreatedAt))}
                      </span>
                    </td>
                  </tr>
                ))}
              </table>
            </ScrollArea>
          </div>
        </Stack>
      </Group>
    </>
  );
};

export default UserSearch;
