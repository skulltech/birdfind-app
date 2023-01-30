import {
  ActionIcon,
  Badge,
  Button,
  Group,
  Modal,
  Stack,
  Tabs,
  Text,
  Title,
  Tooltip,
  useMantineTheme,
} from "@mantine/core";
import { useSupabaseClient } from "@supabase/auth-helpers-react";
import {
  IconChevronLeft,
  IconPlayerPause,
  IconPlayerPlay,
  IconRefresh,
  IconSettings,
  IconTrash,
} from "@tabler/icons";
import Head from "next/head";
import { useRouter } from "next/router";
import dayjs from "dayjs";
import RelativeTime from "dayjs/plugin/relativeTime";
import { FilterForm, Filters } from "../../components/FilterForm/FilterForm";
import { openConfirmModal } from "@mantine/modals";
import { useEffect, useState } from "react";
import { Profiles } from "../../components/CampaignResults/Profiles";
import { Tweets } from "../../components/CampaignResults/Tweets";
import { ParamChipGroup } from "../../components/CampaignForm/ParamChipGroup";
import { CampaignForm } from "../../components/CampaignForm/CampaignForm";
import { getCampaign } from "../../utils/campaigns";

dayjs.extend(RelativeTime);

const Campaign = ({ width }) => {
  const router = useRouter();
  const { id } = router.query;
  const supabase = useSupabaseClient();
  const theme = useMantineTheme();

  const [editCampaignModalOpened, setEditCampaignModalOpened] = useState(false);

  // Campaign and filters
  const [campaign, setCampaign] = useState(null);
  const [activeTab, setActiveTab] = useState<"profiles" | "tweets">("profiles");

  // Campaign actions
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [pauseLoading, setPauseLoading] = useState(false);
  const [refreshLoading, setRefreshLoading] = useState(false);

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

  const fetchCampaign = async () => {
    setRefreshLoading(true);
    try {
      const campaign = await getCampaign({
        supabase,
        id: BigInt(id as string),
      });
      setCampaign(campaign);
    } catch (error) {
      console.log(error);
    }
    setRefreshLoading(false);
  };

  // Fetch campaign on first load
  useEffect(() => {
    fetchCampaign();
  }, []);

  // Update campaign filters in database
  const updateFilters = async (filters: Filters) => {
    try {
      await supabase
        .from("campaign")
        .update({ filters })
        .eq("id", campaign.id)
        .throwOnError();
    } catch (error) {
      console.log(error);
    }
  };

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
        <>
          <Modal
            opened={editCampaignModalOpened}
            size="xl"
            onClose={() => setEditCampaignModalOpened(false)}
            title="Edit campaign"
          >
            <CampaignForm
              campaign={campaign}
              onSubmit={async () => {
                setEditCampaignModalOpened(false);
                await fetchCampaign();
              }}
            />
          </Modal>
          <Stack spacing="sm" mt="sm" w={width}>
            <Stack>
              <Group position="apart" align="flex-start">
                <Stack>
                  <Group align="center">
                    <ActionIcon
                      variant="outline"
                      size="md"
                      color={theme.primaryColor}
                      onClick={() => router.push("/")}
                    >
                      <IconChevronLeft size={18} />
                    </ActionIcon>
                    <Title order={3}>Campaign: {campaign.name}</Title>
                    <Badge
                      size="lg"
                      color={campaign.paused ? "yellow" : "green"}
                      variant="outline"
                    >
                      {campaign.paused ? "Paused" : "Active"}
                    </Badge>
                  </Group>
                  <ParamChipGroup
                    keywords={campaign.keywords}
                    entities={campaign.entities}
                  />
                </Stack>
                <Stack align="flex-end" spacing="xs">
                  <Group spacing="xs">
                    <Tooltip label="Refresh campaign">
                      <ActionIcon
                        variant="outline"
                        color={theme.primaryColor}
                        size="lg"
                        loading={refreshLoading}
                        onClick={fetchCampaign}
                      >
                        <IconRefresh size={18} />
                      </ActionIcon>
                    </Tooltip>
                    <Tooltip label="Pause campaign">
                      <ActionIcon
                        variant="outline"
                        color={campaign.paused ? "green" : "yellow"}
                        size="lg"
                        loading={pauseLoading}
                        onClick={pauseCampaign}
                      >
                        {campaign.paused ? (
                          <IconPlayerPlay size={18} />
                        ) : (
                          <IconPlayerPause size={18} />
                        )}
                      </ActionIcon>
                    </Tooltip>
                    <Tooltip label="Delete campaign">
                      <ActionIcon
                        onClick={deleteCampaign}
                        color="red"
                        variant="outline"
                        size="lg"
                      >
                        <IconTrash size={18} />
                      </ActionIcon>
                    </Tooltip>
                    <Button
                      variant="outline"
                      leftIcon={<IconSettings size={18} />}
                      onClick={() => setEditCampaignModalOpened(true)}
                    >
                      Edit campaign
                    </Button>
                  </Group>
                  <Text>
                    <span style={{ fontWeight: "bold", fontSize: "1.2rem" }}>
                      {campaign.profileCount}
                    </span>{" "}
                    accounts,{" "}
                    <span style={{ fontWeight: "bold", fontSize: "1.2rem" }}>
                      {campaign.tweetCount}
                    </span>{" "}
                    tweets before filters
                  </Text>
                </Stack>
              </Group>
              <FilterForm
                filters={campaign.filters}
                setFilters={async (setFiltersAction) => {
                  // It's a reducer function
                  if (typeof setFiltersAction == "function") {
                    await updateFilters(setFiltersAction(campaign.filters));
                    setCampaign((prev) => ({
                      ...prev,
                      filters: setFiltersAction(prev.filters),
                    }));
                    // It's a new filters object
                  } else {
                    await updateFilters(setFiltersAction);
                    setCampaign((prev) => ({
                      ...prev,
                      filters: setFiltersAction,
                    }));
                  }
                }}
              />
            </Stack>

            <Tabs
              mt="md"
              value={activeTab}
              // @ts-ignore
              onTabChange={setActiveTab}
              variant="outline"
            >
              <Tabs.List grow>
                <Tabs.Tab value="profiles">Profiles</Tabs.Tab>
                <Tabs.Tab value="tweets">Tweets</Tabs.Tab>
              </Tabs.List>

              <Tabs.Panel value="profiles">
                <Stack pt="md">
                  <Profiles campaign={campaign} filters={campaign.filters} />
                </Stack>
              </Tabs.Panel>
              <Tabs.Panel value="tweets">
                <Stack pt="md">
                  <Tweets campaign={campaign} filters={campaign.filters} />
                </Stack>
              </Tabs.Panel>
            </Tabs>
          </Stack>
        </>
      )}
    </>
  );
};

export default Campaign;
