import { campaignColumns } from "@birdfind/common";
import {
  Badge,
  Button,
  Group,
  Loader,
  Modal,
  Paper,
  Stack,
  Text,
  Title,
  UnstyledButton,
} from "@mantine/core";
import { useSupabaseClient } from "@supabase/auth-helpers-react";
import { IconCirclePlus } from "@tabler/icons";
import Head from "next/head";
import { useEffect, useState } from "react";
import {
  Campaign,
  CampaignForm,
} from "../components/CampaignForm/CampaignForm";
import { ParamChipGroup } from "../components/CampaignForm/ParamChipGroup";

const Home = ({ width }) => {
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const supabase = useSupabaseClient();
  const [createCampaignModalOpened, setCreateCampaignModalOpened] =
    useState(false);
  const [loading, setLoading] = useState(true);

  // Fetch campaigns on first load
  useEffect(() => {
    const fetchCampaigns = async () => {
      setLoading(true);
      try {
        const campaigns: Campaign[] = [];

        const { data } = await supabase
          .from("campaign")
          .select(campaignColumns)
          .eq("deleted", false)
          .throwOnError();
        for (const campaign of data) {
          const { data: entityIds } = await supabase
            .from("campaign_entity")
            .select("entity_id")
            .eq("campaign_id", campaign.id)
            .throwOnError();
          const { data: entities } = await supabase
            .from("entity")
            .select("id,name")
            .in(
              "id",
              entityIds.map((x) => x.entity_id)
            )
            .throwOnError();
          campaigns.push({ ...campaign, entities });
        }

        setCampaigns(campaigns);
      } catch (error) {
        console.log(error);
      }
      setLoading(false);
    };

    fetchCampaigns();
  }, []);

  return (
    <>
      <Head>
        <title>Home | Birdfind</title>
      </Head>
      <Modal
        opened={createCampaignModalOpened}
        size="xl"
        onClose={() => setCreateCampaignModalOpened(false)}
        title="Create a new campaign"
      >
        <CampaignForm />
      </Modal>
      {loading ? (
        <Loader mt="xl" />
      ) : campaigns.length == 0 ? (
        <Stack mt="xl" w={width}>
          <Stack spacing={2}>
            <Title order={3}>Create a campaign</Title>
            <Text size="sm" color="gray">
              Create a campaign to get started
            </Text>
          </Stack>
          <CampaignForm />
        </Stack>
      ) : (
        <Stack align="stretch" mt="md" w={width}>
          <Group position="apart">
            <Text>
              You have {campaigns.length}
              {campaigns.length == 1 ? " campaign" : " campaigns"}
            </Text>
            <Button
              variant="outline"
              radius="md"
              leftIcon={<IconCirclePlus />}
              onClick={() => setCreateCampaignModalOpened(true)}
            >
              Create a new campaign
            </Button>
          </Group>

          <Stack style={{ flex: 1 }}>
            {campaigns.map((campaign) => (
              <UnstyledButton
                key={campaign.id}
                component="a"
                href={"/campaigns/" + campaign.id}
              >
                <Paper
                  withBorder
                  radius="md"
                  p="xs"
                  shadow="md"
                  className="hover"
                >
                  <Group position="apart">
                    <Stack>
                      <Group spacing="md" align="center">
                        <Text size="lg">Campaign: {campaign.name}</Text>
                        <Badge
                          variant="outline"
                          color={campaign.paused ? "yellow" : "green"}
                        >
                          {campaign.paused ? "Paused" : "Active"}
                        </Badge>
                      </Group>
                      <ParamChipGroup
                        keywords={campaign.keywords}
                        entities={campaign.entities}
                      />
                    </Stack>
                  </Group>
                </Paper>
              </UnstyledButton>
            ))}
          </Stack>
        </Stack>
      )}
    </>
  );
};

export default Home;
