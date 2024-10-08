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
  useMantineTheme,
} from "@mantine/core";
import { useSupabaseClient } from "@supabase/auth-helpers-react";
import { IconCirclePlus } from "@tabler/icons";
import Head from "next/head";
import { useEffect, useState } from "react";
import { CampaignForm } from "../components/CampaignForm/CampaignForm";
import { Campaign, getAllCampaigns } from "../utils/campaigns";

const Home = () => {
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const supabase = useSupabaseClient();
  const [createCampaignModalOpened, setCreateCampaignModalOpened] =
    useState(false);
  const [loading, setLoading] = useState(true);
  const theme = useMantineTheme();

  // Fetch campaigns on first load
  useEffect(() => {
    const fetchCampaigns = async () => {
      setLoading(true);
      try {
        const campaigns = await getAllCampaigns({ supabase });
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
        <Loader mt="xl" mx="auto" />
      ) : campaigns.length == 0 ? (
        <Stack mt="xl" sx={{ maxWidth: theme.breakpoints.md }} mx="auto">
          <Stack spacing={2}>
            <Title order={3}>Create a campaign</Title>
            <Text size="sm" color="gray">
              Create a campaign to get started
            </Text>
          </Stack>
          <CampaignForm />
        </Stack>
      ) : (
        <Stack mt="md" mx="auto">
          <Group position="apart">
            <Text>
              You have {campaigns.length}
              {campaigns.length == 1 ? " campaign" : " campaigns"}
            </Text>
            <Button
              variant="outline"
              radius="md"
              leftIcon={<IconCirclePlus size={18} />}
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
                  <Stack>
                    <Group position="apart">
                      <Group spacing="md" align="center">
                        <Text size="lg">Campaign: {campaign.name}</Text>
                        {campaign.paused && (
                          <Badge variant="outline" color="yellow">
                            Paused
                          </Badge>
                        )}
                      </Group>
                      <Text>
                        <span
                          style={{ fontWeight: "bold", fontSize: "1.2rem" }}
                        >
                          {campaign.profileCount}
                        </span>{" "}
                        accounts,{" "}
                        <span
                          style={{ fontWeight: "bold", fontSize: "1.2rem" }}
                        >
                          {campaign.tweetCount}
                        </span>{" "}
                        tweets found so far
                      </Text>
                    </Group>
                  </Stack>
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
