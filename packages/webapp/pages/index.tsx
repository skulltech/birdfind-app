import { Group, Stack, Text } from "@mantine/core";
import Head from "next/head";
import { JobItem } from "../components/JobItem";
import { QueriesForm } from "../components/QueriesForm/QueriesForm";

const Home = () => {
  const jobs = [];

  return (
    <>
      <Head>
        <title>Home | Birdfind</title>
      </Head>
      <QueriesForm />
      <Group align="flex-start">
        <Stack style={{ flex: 1 }} align="center" p="md">
          <Text>
            {jobs.length ? jobs.length : "No"}{" "}
            {jobs.length == 1 ? "job" : "jobs"}
          </Text>
          <Stack sx={{ flex: 1 }}>
            {jobs.map((job) => (
              <JobItem key={job.id} job={job} compact={false} />
            ))}
          </Stack>
        </Stack>
      </Group>
    </>
  );
};

export default Home;
