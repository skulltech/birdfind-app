import {
  ActionIcon,
  Center,
  CloseButton,
  Group,
  Loader,
  Paper,
  Progress,
  ScrollArea,
  Stack,
  Text,
} from "@mantine/core";
import { openConfirmModal } from "@mantine/modals";
import {
  SupabaseClient,
  useSupabaseClient,
} from "@supabase/auth-helpers-react";
import { IconPlayerPause, IconPlayerPlay } from "@tabler/icons";
import { Relation } from "@twips/common";
import { useEffect, useState } from "react";
import { AccountNavbar } from "../../components/AccountNavbar";

type Job = {
  id: number;
  createdAt: Date;
  paused: boolean;
  relation: Relation;
  username: string;
  updatedCount: number;
  totalCount?: number;
};

const getJobs = async (supabase: SupabaseClient): Promise<Job[]> => {
  const { data: jobs, error: selectJobsError } = await supabase
    .from("update_relation_job")
    .select(
      `id,created_at,paused,relation,updated_count,
      twitter_profile (username,followers_count,following_count)`
    )
    .eq("finished", false)
    .order("created_at", { ascending: false });
  if (selectJobsError) throw selectJobsError;

  return jobs.map((x) => {
    return {
      id: parseInt(x.id),
      createdAt: new Date(x.created_at),
      paused: x.paused,
      relation: x.relation,
      // @ts-ignore
      username: x.twitter_profile.username,
      updatedCount: x.updated_count,
      totalCount:
        x.relation === "followers"
          ? // @ts-ignore
            x.twitter_profile.followers_count
          : x.relation === "following"
          ? // @ts-ignore
            x.twitter_profile.following_count
          : null,
    };
  });
};

type JobChipProps = {
  job: Job;
  handlePause: (id: number, paused: boolean) => Promise<void>;
  handleDelete: (id: number) => Promise<void>;
};

const JobChip = ({
  job: { id, relation, username, paused, updatedCount, totalCount },
  handleDelete,
  handlePause,
}: JobChipProps) => {
  const [pauseLoading, setPauseLoading] = useState(false);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const supabase = useSupabaseClient();
  // Progress, initial value from counts
  const [progress, setProgress] = useState((updatedCount / totalCount) * 100);

  useEffect(() => {
    supabase
      .channel(`public:update_relation_job:id=eq.${id}`)
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "update_relation_job",
          filter: `id=eq.${id}`,
        },
        (payload) => {
          setProgress((payload.new.updated_count / totalCount) * 100);
        }
      )
      .subscribe();
  }, []);

  return (
    <Paper shadow="md" withBorder p="xs" radius="md">
      <Stack pr="md">
        <Group position="apart">
          <Group>
            <Text>{`Fetch ${
              relation == "blocking"
                ? "blocklist"
                : relation == "muting"
                ? "mutelist"
                : relation
            } of @${username}`}</Text>
          </Group>
          <Group>
            <ActionIcon
              size="sm"
              onClick={async () => {
                setPauseLoading(true);
                try {
                  handlePause(id, !paused);
                } catch (error) {
                  console.log(error);
                }
                setPauseLoading(false);
              }}
              loading={pauseLoading}
            >
              {paused ? <IconPlayerPlay /> : <IconPlayerPause />}
            </ActionIcon>
            <CloseButton
              size="sm"
              radius="lg"
              variant="outline"
              color="red"
              onClick={async () => {
                setDeleteLoading(true);
                try {
                  handleDelete(id);
                } catch (error) {
                  console.log(error);
                }
                setDeleteLoading(false);
              }}
              loading={deleteLoading}
            />
          </Group>
        </Group>
        <Progress
          // animate
          value={progress}
          label={`${progress.toFixed(0)}%`}
          size="xl"
        />
      </Stack>
    </Paper>
  );
};

const Jobs = () => {
  const [jobs, setJobs] = useState<Job[]>(null);
  const supabase = useSupabaseClient();

  const fetchJobs = async () => setJobs(await getJobs(supabase));

  const handlePause = async (id: number, paused: boolean) => {
    const { error } = await supabase
      .from("update_relation_job")
      .update({ paused })
      .eq("id", id);
    if (error) throw error;

    // Reload jobs
    await fetchJobs();
  };

  const handleDelete = async (id: number) => {
    openConfirmModal({
      title: "Are you sure you want to delete this job?",
      children: (
        <Text size="sm">
          This will permanently delete this background job. All progress made so
          far will be lost.
        </Text>
      ),
      labels: { confirm: "Confirm", cancel: "Cancel" },
      onCancel: () => {},
      onConfirm: async () => {
        const { error } = await supabase
          .from("update_relation_job")
          .delete()
          .eq("id", id);
        if (error) throw error;

        // Reload jobs
        await fetchJobs();
      },
    });
  };

  // Load jobs on first load
  useEffect(() => {
    fetchJobs();
  }, [supabase]);

  return (
    <Group>
      <AccountNavbar activePage="jobs" />
      {jobs === null ? (
        <Loader />
      ) : jobs.length == 0 ? (
        <Center style={{ flex: 1 }}>
          <Text>No jobs</Text>
        </Center>
      ) : (
        <ScrollArea style={{ height: "80vh", width: "80hw", flex: 1 }}>
          <Stack>
            {jobs.map((job) => (
              <JobChip
                key={job.id}
                job={job}
                handleDelete={handleDelete}
                handlePause={handlePause}
              />
            ))}
          </Stack>
        </ScrollArea>
      )}
    </Group>
  );
};

export default Jobs;
