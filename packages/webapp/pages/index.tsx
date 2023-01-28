import {
  Button,
  Center,
  Group,
  Modal,
  Stack,
  Text,
  Title,
  useMantineTheme,
} from "@mantine/core";
import { useSupabaseClient } from "@supabase/auth-helpers-react";
import Head from "next/head";
import { useEffect, useState } from "react";
import { CampaignItem } from "../components/CampaignItem";
import { CampaignForm } from "../components/CampaignForm/CampaignForm";

const Home = () => {
  const [campaigns, setCampaigns] = useState([]);
  const supabase = useSupabaseClient();
  const theme = useMantineTheme();
  const [createCampaignModalOpened, setCreateCampaignModalOpened] =
    useState(false);

  useEffect(() => {
    const fetchCampaigns = async () => {
      const { data } = await supabase
        .from("campaign")
        .select("id,keywords,created_at,name")
        .throwOnError();
      setCampaigns(data);
    };

    fetchCampaigns();
  });

  return (
    <>
      <Head>
        <title>Home | Birdfind</title>
      </Head>
      <Modal
        opened={createCampaignModalOpened}
        onClose={() => setCreateCampaignModalOpened(false)}
        title="Create a new campaign"
      >
        <CampaignForm />
      </Modal>
      {campaigns.length == 0 ? (
        <Stack
          align="stretch"
          w={theme.breakpoints.md}
          p="md"
          pt="xs"
          mx="auto"
          mt="xl"
          style={{ border: "1px solid black", borderRadius: theme.radius.md }}
        >
          <Stack spacing={2}>
            <Title order={3}>Create a campaign</Title>
            <Text size="sm" color="gray">
              Create a campaign to get started
            </Text>
          </Stack>
          <CampaignForm />
        </Stack>
      ) : (
        <Stack align="stretch" mt="md">
          <Group position="apart">
            <Text>
              You have created {campaigns.length}
              {campaigns.length == 1 ? " campaign" : " campaigns"}
            </Text>
            <Button onClick={() => setCreateCampaignModalOpened(true)}>
              Create a new campaign
            </Button>
          </Group>

          <Stack sx={{ flex: 1 }}>
            {campaigns.map((campaign) => (
              <CampaignItem key={campaign.id} campaign={campaign} />
            ))}
          </Stack>
        </Stack>
      )}
    </>
  );
};

export default Home;
