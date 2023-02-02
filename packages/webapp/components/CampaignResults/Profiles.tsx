import { useSupabaseClient } from "@supabase/auth-helpers-react";
import dayjs from "dayjs";
import RelativeTime from "dayjs/plugin/relativeTime";
import { useEffect, useState } from "react";
import {
  CampaignProfile,
  getCampaignProfiles,
  ProfileSort,
} from "../../utils/profiles";
import { TwitterProfileCard } from "../TwitterProfileCard";
import { ResultsTable } from "./ResultsTable";
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
    <ResultsTable
      {...{
        count,
        loading,
        pageIndex,
        setPageIndex,
        sort,
        setSort,
        sortItems: [
          {
            value: "relevance",
            label: "Relevance",
            group: "Recommened",
          },
          {
            value: "followersDescending",
            label: "Followers: High to low",
            group: "Followers",
          },
          {
            value: "followersAscending",
            label: "Followers: Low to high",
            group: "Followers",
          },
          {
            value: "followingDescending",
            label: "Following: High to low",
            group: "Following",
          },
          {
            value: "followingAscending",
            label: "Following: Low to high",
            group: "Following",
          },
          {
            value: "tweetsDescending",
            label: "Tweets: High to low",
            group: "Tweets",
          },
          {
            value: "tweetsAscending",
            label: "Tweets: Low to high",
            group: "Tweets",
          },
        ],
        rows: results.map(
          (result) =>
            function Row({ ...props }) {
              return (
                <tr {...props}>
                  <td>
                    <TwitterProfileCard profile={result} />
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
                      {dayjs().to(dayjs(result.userCreatedAt), true)}
                    </span>{" "}
                    ago
                  </td>
                </tr>
              );
            }
        ),
      }}
    />
  );
};
