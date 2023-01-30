import {
  Badge,
  Button,
  Group,
  Modal,
  Stack,
  Tabs,
  Text,
  Title,
} from "@mantine/core";
import { useSupabaseClient } from "@supabase/auth-helpers-react";
import {
  IconPlayerPause,
  IconPlayerPlay,
  IconSettings,
  IconTrash,
} from "@tabler/icons";
import Head from "next/head";
import { useRouter } from "next/router";
import dayjs from "dayjs";
import RelativeTime from "dayjs/plugin/relativeTime";
import { campaignColumns } from "@birdfind/common";
import { FilterForm, Filters } from "../../components/FilterForm/FilterForm";
import { openConfirmModal } from "@mantine/modals";
import { useEffect, useState } from "react";
import { Profiles } from "../../components/CampaignResults/Profiles";
import { Tweets } from "../../components/CampaignResults/Tweets";
import { ParamChipGroup } from "../../components/CampaignForm/ParamChipGroup";
import { CampaignForm } from "../../components/CampaignForm/CampaignForm";

dayjs.extend(RelativeTime);

const Campaign = () => {
  const router = useRouter();
  const { id } = router.query;
  const supabase = useSupabaseClient();

  const [editCampaignModalOpened, setEditCampaignModalOpened] = useState(false);

  // Campaign and filters
  const [campaign, setCampaign] = useState(null);
  const [entities, setEntities] = useState([]);
  const [activeTab, setActiveTab] = useState<"profiles" | "tweets">("profiles");

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

  const fetchCampaign = async () => {
    const { data: campaign } = await supabase
      .from("campaign")
      .select(campaignColumns)
      .eq("id", id)
      .throwOnError()
      .maybeSingle();
    const { data: entityIds } = await supabase
      .from("campaign_entity")
      .select("entity_id::text")
      .eq("campaign_id", campaign.id)
      .throwOnError();
    const { data: entities } = await supabase
      .from("entity")
      .select("id::text,name")
      .in(
        "id",
        // @ts-ignore
        entityIds.map((e) => e.entity_id)
      )
      .throwOnError();

    setCampaign(campaign);
    setEntities(entities);
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
              campaign={{ ...campaign, entities }}
              onSubmit={async () => {
                setEditCampaignModalOpened(false);
                await fetchCampaign();
              }}
            />
          </Modal>
          <Stack spacing={0}>
            <Stack>
              <Group>
                <Title order={3}>Campaign: {campaign.name}</Title>
                <Badge>{campaign.paused ? "Paused" : "Active"}</Badge>
                <ParamChipGroup
                  keywords={campaign.keywords}
                  entities={entities}
                />
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
                  <Button
                    leftIcon={<IconSettings size={16} />}
                    onClick={() => setEditCampaignModalOpened(true)}
                  >
                    Edit campaign
                  </Button>
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
              value={activeTab}
              // @ts-ignore
              onTabChange={setActiveTab}
            >
              <Tabs.List grow>
                <Tabs.Tab value="profiles">Profiles</Tabs.Tab>
                <Tabs.Tab value="tweets">Tweets</Tabs.Tab>
              </Tabs.List>

              <Tabs.Panel value="profiles">
                <Profiles campaign={campaign} filters={campaign.filters} />
              </Tabs.Panel>
              <Tabs.Panel value="tweets">
                <Tweets campaign={campaign} filters={campaign.filters} />
              </Tabs.Panel>
            </Tabs>
          </Stack>
        </>
      )}
    </>
  );
};

export default Campaign;
