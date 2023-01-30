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
  CampaignTweet,
  getCampaignTweets,
  TweetSort,
} from "../../utils/tweets";
import { TweetCard } from "../TweetCard";
import { CampaignResultsProps, largeNumberFormatter } from "./utils";

dayjs.extend(RelativeTime);

export const Tweets = ({ campaign, filters }: CampaignResultsProps) => {
  const supabase = useSupabaseClient();

  const [pageIndex, setPageIndex] = useState(0);
  const [sort, setSort] = useState<TweetSort>("likesDescending");

  // Search results
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState<CampaignTweet[]>([]);
  const [count, setCount] = useState(0);

  // Get campaign results
  const fetchCampaignResults = async () => {
    if (!campaign) {
      setResults([]);
      setCount(0);
      return;
    }
    setLoading(true);

    const { results, count } = await getCampaignTweets({
      supabase,
      campaignId: campaign.id,
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
                  value: "ageDescending",
                  label: "Age: New to old",
                  group: "Age",
                },
                {
                  value: "ageAscending",
                  label: "Age: Old to new",
                  group: "Age",
                },
                {
                  value: "likesDescending",
                  label: "Likes: High to low",
                  group: "Likes",
                },
                {
                  value: "likesAscending",
                  label: "Likes: Low to high",
                  group: "Likes",
                },
                {
                  value: "retweetsDescending",
                  label: "Retweets: High to low",
                  group: "Retweets",
                },
                {
                  value: "retweetsAscending",
                  label: "Retweets: Low to high",
                  group: "Retweets",
                },
                {
                  value: "repliesDescending",
                  label: "Replies: High to low",
                  group: "Replies",
                },
                {
                  value: "repliesAscending",
                  label: "Replies: Low to high",
                  group: "Replies",
                },
                {
                  value: "quotesDescending",
                  label: "Quotes: High to low",
                  group: "Quotes",
                },
                {
                  value: "quotesAscending",
                  label: "Quotes: Low to high",
                  group: "Quotes",
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
                  <TweetCard campaignTweet={result} />
                </td>
                <td style={{ whiteSpace: "nowrap" }}>
                  <span style={{ fontWeight: "bold", fontSize: "1.2rem" }}>
                    {largeNumberFormatter(result.likeCount)}
                  </span>{" "}
                  likes
                </td>
                <td style={{ whiteSpace: "nowrap" }}>
                  <span style={{ fontWeight: "bold", fontSize: "1.2rem" }}>
                    {largeNumberFormatter(result.replyCount)}
                  </span>{" "}
                  replies
                </td>
                <td style={{ whiteSpace: "nowrap" }}>
                  <span style={{ fontWeight: "bold", fontSize: "1.2rem" }}>
                    {largeNumberFormatter(result.quoteCount)}
                  </span>{" "}
                  quotes
                </td>
                <td style={{ whiteSpace: "nowrap" }}>
                  <span style={{ fontWeight: "bold", fontSize: "1.2rem" }}>
                    {largeNumberFormatter(result.retweetCount)}
                  </span>{" "}
                  retweets
                </td>
                <td style={{ whiteSpace: "nowrap" }}>
                  Posted{" "}
                  <span style={{ fontWeight: "bold", fontSize: "1.2rem" }}>
                    {dayjs().to(dayjs(result.tweetCreatedAt), true)}
                  </span>{" "}
                  ago
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </ScrollArea>
    </>
  );
};
