import {
  Badge,
  Button,
  Group,
  Loader,
  NativeSelect,
  Pagination,
  ScrollArea,
  Stack,
  Switch,
  Text,
  Title,
  useMantineTheme,
} from "@mantine/core";
import { useSupabaseClient } from "@supabase/auth-helpers-react";
import {
  IconPlayerPause,
  IconPlayerPlay,
  IconSettings,
  IconSortAscending,
  IconSortDescending,
  IconTrash,
} from "@tabler/icons";
import Head from "next/head";
import { useRouter } from "next/router";
import { useEffect, useState } from "react";
import { UserProfileCard } from "../../components/UserProfileCard";
import { useUser } from "../../providers/UserProvider";
import { CampaignResult, getCampaignResults } from "../../utils/supabase";
import dayjs from "dayjs";
import RelativeTime from "dayjs/plugin/relativeTime";
import { campaignColumns } from "@birdfind/common";
import { FilterForm, Filters } from "../../components/FilterForm/FilterForm";
import { openConfirmModal } from "@mantine/modals";

dayjs.extend(RelativeTime);

const largeNumberFormatter = (value: number): string => {
  if (value < 1e3) return value.toString();
  if (value >= 1e3 && value < 1e6)
    return (value / 1e3).toFixed(1).replace(/\.0$/, "") + "k";
  if (value >= 1e6) return (value / 1e6).toFixed(1).replace(/\.0$/, "") + "m";
};

const Campaign = () => {
  const router = useRouter();
  const { id } = router.query;
  const { user } = useUser();
  const supabase = useSupabaseClient();

  const [campaign, setCampaign] = useState(null);

  // Search inputs
  const [filters, setFilters] = useState<Filters>({});
  const [pageIndex, setPageIndex] = useState(0);
  const [orderBy, setOrderBy] = useState<
    "followersCount" | "followingCount" | "tweetCount"
  >("followersCount");
  const [orderAscending, setOrderAscending] = useState(false);

  // Search results
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState<CampaignResult[]>([]);
  const [count, setCount] = useState(0);

  // Campaign actions
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [pauseLoading, setPauseLoading] = useState(false);

  const deleteCampaign = () =>
    openConfirmModal({
      title: "Are you sure you want to delete this campaign?",
      children: <Text size="sm">This action cannot be undone.</Text>,
      labels: { confirm: "Delete", cancel: "Cancel" },
      onCancel: () => console.log("Cancel"),
      confirmProps: { color: "red", loading: deleteLoading },
      onConfirm: async () => {
        if (!campaign) return;
        setDeleteLoading(true);

        try {
          await supabase
            .from("campaign")
            .update({ deleted: true })
            .eq("id", campaign.id)
            .throwOnError();
          router.push("/");
        } catch (error) {
          console.error(error);
        }

        setDeleteLoading(false);
      },
    });

  // Get campaign results
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
      orderBy,
      orderAscending,
    });
    setResults(results);
    setCount(count);
    setLoading(false);
  };

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

      // Set campaign view
      if (data.view?.filters !== undefined) setFilters(data.view?.filters);
      if (data.view?.orderBy !== undefined) setOrderBy(data.view?.orderBy);
      if (data.view?.orderAscending !== undefined)
        setOrderAscending(data.view?.orderAscending);
    };

    fetchCampaign();
  }, []);

  // Update campaign view in database
  const updateView = async () => {
    if (!campaign) return;
    try {
      await supabase
        .from("campaign")
        .update({ view: { filters, orderBy, orderAscending } })
        .eq("id", campaign.id)
        .throwOnError();
    } catch (error) {
      console.log(error);
    }
  };

  // Search and set page to 0, and store view in database
  useEffect(() => {
    fetchCampaignResults();
    setPageIndex(0);
    updateView();
  }, [filters, orderBy, orderAscending, campaign]);

  // Search on page change
  useEffect(() => {
    fetchCampaignResults();
  }, [pageIndex]);

  const theme = useMantineTheme();

  const pauseCampaign = async () => {
    if (!campaign) return;
    setPauseLoading(true);

    try {
      await supabase
        .from("campaign")
        .update({ paused: !campaign.paused })
        .eq("id", campaign.id)
        .throwOnError();
      setCampaign((prev) => ({ ...prev, paused: !prev.paused }));
    } catch (error) {
      console.error(error);
    }

    setPauseLoading(false);
  };

  return (
    <>
      <Head>
        <title>Campaign | Birdfind</title>
      </Head>
      {campaign && (
        <Stack spacing={0}>
          <Stack>
            <Group>
              <Title order={3}>Campaign: {campaign.name}</Title>
              <Badge>{campaign.paused ? "Paused" : "Active"}</Badge>
              <Text size="lg">{count} Twitter accounts found so far</Text>
              <Stack>
                <Button
                  leftIcon={
                    campaign.paused ? (
                      <IconPlayerPlay size={16} />
                    ) : (
                      <IconPlayerPause size={16} />
                    )
                  }
                  color={campaign.paused ? "green" : "yellow"}
                  loading={pauseLoading}
                  onClick={pauseCampaign}
                >
                  {campaign.paused ? "Resume" : "Pause"} campaign
                </Button>
                <Button
                  leftIcon={<IconTrash size={16} />}
                  onClick={deleteCampaign}
                  color="red"
                >
                  Delete campaign
                </Button>
                <Button leftIcon={<IconSettings size={16} />}>
                  Edit campaign
                </Button>
              </Stack>
            </Group>
            <FilterForm filters={filters} setFilters={setFilters} />
          </Stack>

          <Group position="apart" style={{ flexDirection: "row-reverse" }}>
            <Group spacing="md">
              <Group spacing={6}>
                <Text weight="bold" size="sm">
                  Sort by
                </Text>
                <NativeSelect
                  // @ts-ignore
                  onChange={(event) => setOrderBy(event.currentTarget.value)}
                  data={[
                    { value: "followersCount", label: "Followers count" },
                    { value: "followingCount", label: "Following count" },
                    { value: "tweetCount", label: "Tweets count" },
                  ]}
                  value={orderBy}
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
                <Switch
                  onLabel={<IconSortAscending size={16} stroke={2.5} />}
                  offLabel={<IconSortDescending size={16} stroke={2.5} />}
                  checked={orderAscending}
                  onChange={(event) =>
                    setOrderAscending(event.currentTarget.checked)
                  }
                  size="sm"
                  style={{ display: "flex" }}
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
        </Stack>
      )}
    </>
  );
};

export default Campaign;
