import {
  Group,
  Loader,
  Pagination,
  ScrollArea,
  Select,
  Text,
} from "@mantine/core";
import { useSupabaseClient } from "@supabase/auth-helpers-react";
import dayjs from "dayjs";
import RelativeTime from "dayjs/plugin/relativeTime";
import { useEffect, useState } from "react";
import {
  CampaignProfile,
  getCampaignProfiles,
  ProfileSort,
} from "../../utils/supabase";
import { Filters } from "../FilterForm/FilterForm";
import { UserProfileCard } from "../UserProfileCard";
import { CampaignResultsProps, largeNumberFormatter } from "./utils";

dayjs.extend(RelativeTime);

export const Profiles = ({ campaign, filters }: CampaignResultsProps) => {
  const supabase = useSupabaseClient();

  const [pageIndex, setPageIndex] = useState(0);
  const [sort, setSort] = useState<ProfileSort>("relevance");

  // Search results
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState<CampaignProfile[]>([]);
  const [count, setCount] = useState(0);

  // Get campaign results
  const fetchCampaignResults = async () => {
    if (!campaign) {
      setResults([]);
      setCount(0);
      return;
    }
    setLoading(true);

    const { results, count } = await getCampaignProfiles({
      supabase,
      campaignId: campaign.id,
      filters,
      pageIndex,
      sort,
    });
    setResults(results);
    setCount(count);
    setLoading(false);
  };

  // Search and set page to 0
  useEffect(() => {
    fetchCampaignResults();
    setPageIndex(0);
  }, [filters, sort, campaign]);

  // Search on page change
  useEffect(() => {
    fetchCampaignResults();
  }, [pageIndex]);

  return (
    <>
      <Group position="apart" style={{ flexDirection: "row-reverse" }}>
        <Group spacing="md">
          <Group spacing={6}>
            <Text weight="bold" size="sm">
              Sort by
            </Text>
            <Select
              // @ts-ignore
              onChange={setSort}
              data={[
                {
                  value: "relevance",
                  label: "Relevance",
                  group: "Smart sorting",
                },
                {
                  value: "followersAscending",
                  label: "Followers: Low to high",
                  group: "Followers",
                },
                {
                  value: "followersDescending",
                  label: "Followers: High to low",
                  group: "Followers",
                },
                {
                  value: "followingAscending",
                  label: "Following: Low to high",
                  group: "Following",
                },
                {
                  value: "followingDescending",
                  label: "Following: High to low",
                  group: "Following",
                },
                {
                  value: "tweetsAscending",
                  label: "Tweets: Low to high",
                  group: "Tweets",
                },
                {
                  value: "tweetsDescending",
                  label: "Tweets: High to low",
                  group: "Tweets",
                },
              ]}
              value={sort}
              size="sm"
              radius="xl"
              styles={{
                input: {
                  lineHeight: "24px",
                  minHeight: "26px",
                  height: "26px",
                },
              }}
            />
          </Group>
          <Group>
            <Pagination
              size="sm"
              page={pageIndex + 1}
              onChange={(page) => setPageIndex(page - 1)}
              total={Math.ceil(count / 100)}
            />
          </Group>
        </Group>

        {loading && <Loader variant="dots" />}
      </Group>

      <ScrollArea style={{ width: "100%" }}>
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
    </>
  );
};
