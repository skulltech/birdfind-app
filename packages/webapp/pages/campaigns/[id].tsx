import {
  ActionIcon,
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
import { UserProfileCard } from "../../components/UserProfileCard";
import { useUser } from "../../providers/UserProvider";
import { Filters } from "../../utils/helpers";
import { getCampaignResults, SearchResult } from "../../utils/supabase";
import decamelize from "decamelize";

// Remove filters
export type RemoveFiltersArg = keyof Filters;

// DayJS import and setup
import dayjs from "dayjs";
import RelativeTime from "dayjs/plugin/relativeTime";
import { campaignColumns } from "@birdfind/common";
dayjs.extend(RelativeTime);

const useStyles = createStyles((theme) => ({
  scrolled: {
    boxShadow: `0 5px 5px -5px ${
      theme.colorScheme === "dark" ? theme.colors.dark[3] : theme.colors.gray[2]
    }`,
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
  const [campaign, setCampaign] = useState(null);
  const [scrolled, setScrolled] = useState(false);

  const [orderBy, setOrderBy] = useState<
    "followersCount" | "followingCount" | "tweetCount"
  >("followersCount");
  const [orderAscending, setOrderAscending] = useState(false);

  const supabase = useSupabaseClient();

  // Fetch campaign on first load
  useEffect(() => {
    const fetchCampaign = async () => {
      const { data } = await supabase
        .from("campaign")
        .select(campaignColumns)
        .eq("id", id)
        .throwOnError()
        .maybeSingle();
      setCampaign(data);
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
  const fetchCampaignResults = async () => {
    if (!user?.twitter || !campaign) {
      setResults([]);
      setCount(0);
      return;
    }
    setLoading(true);

    const { results, count } = await getCampaignResults({
      supabase,
      campaignId: campaign.id,
      filters,
      pageIndex,
      orderBy: decamelize(orderBy),
      orderAscending,
    });
    console.log(results);
    setResults(results);
    setCount(count);
    setLoading(false);
  };

  // Search and set page to 0
  useEffect(() => {
    fetchCampaignResults();
    setPageIndex(0);
  }, [filters, orderBy, orderAscending]);

  // Search on page change
  useEffect(() => {
    fetchCampaignResults();
  }, [pageIndex]);

  return (
    <>
      <Head>
        <title>Search | Birdfind</title>
      </Head>
      <Stack spacing={0} sx={{ flex: 1 }}>
        <Group
          position="apart"
          p="md"
          className={cx({
            [classes.scrolled]: scrolled,
          })}
        >
          <Group>
            <NativeSelect
              data={[
                { value: "followersCount", label: "Followers count" },
                { value: "followingCount", label: "Following count" },
                { value: "tweetCount", label: "Tweets count" },
              ]}
              value={orderBy}
              // @ts-ignore
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
            <ActionIcon size="sm" color="blue" onClick={fetchCampaignResults}>
              <IconRefresh />
            </ActionIcon>
          </Group>
        </Group>

        <div style={{ position: "relative" }}>
          <LoadingOverlay visible={loading} overlayBlur={2} />
          <ScrollArea
            sx={{
              height: "calc(100vh - var(--mantine-header-height, 0px) - 100px)",
            }}
            onScrollPositionChange={({ y }) => setScrolled(y !== 0)}
          >
            <table>
              <tbody>
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
              </tbody>
            </table>
          </ScrollArea>
        </div>
      </Stack>
    </>
  );
};

export default UserSearch;
