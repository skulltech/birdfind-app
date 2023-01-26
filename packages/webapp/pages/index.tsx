import { Group, Stack, Text } from "@mantine/core";
import { useSupabaseClient } from "@supabase/auth-helpers-react";
import Head from "next/head";
import { useEffect, useState } from "react";
import { CampaignItem } from "../components/CampaignItem";
import { CampaignForm } from "../components/CampaignForm/CampaignForm";

const Home = () => {
  const [campaigns, setCampaigns] = useState([]);
  const supabase = useSupabaseClient();

  useEffect(() => {
    const fetchCampaigns = async () => {
      const { data } = await supabase
        .from("user_campaigns")
        .select("id, keywords, entities, created_at")
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
      <CampaignForm />
      <Group align="flex-start">
        <Stack style={{ flex: 1 }} align="center" p="md">
          <Text>
            {campaigns.length ? campaigns.length : "No"}{" "}
            {campaigns.length == 1 ? "job" : "jobs"}
          </Text>
          <Stack sx={{ flex: 1 }}>
            {campaigns.map((campaign) => (
              <CampaignItem key={campaign.id} campaign={campaign} />
            ))}
          </Stack>
        </Stack>
      </Group>
    </>
  );
};

export default Home;
