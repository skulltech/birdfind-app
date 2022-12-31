import { Text } from "@mantine/core";
import { useListState } from "@mantine/hooks";
import { openConfirmModal } from "@mantine/modals";
import { showNotification } from "@mantine/notifications";
import { SupabaseClient } from "@supabase/supabase-js";
import { Relation } from "@twips/common";
import {
  createContext,
  ReactNode,
  useContext,
  useEffect,
  useState,
} from "react";
import { useTwipsUser } from "./TwipsUserProvider";

export type Job = {
  id: number;
  createdAt: Date;
  paused: boolean;
  relation: Relation;
  username: string;
  updatedCount: number;
  totalCount?: number;
  progress?: number;
};

const TwipsJobsContext = createContext<{
  jobs: Job[];
  loading: boolean;
  pauseJob: (id: number, paused: boolean) => Promise<void>;
  deleteJob: (id: number) => Promise<void>;
  refresh: () => void;
}>({
  jobs: [],
  loading: false,
  pauseJob: async () => {},
  deleteJob: async () => {},
  refresh: () => {},
});

interface TwipsJobsProviderProps {
  supabase: SupabaseClient;
  children: ReactNode;
}

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
    const updatedCount: number = x.updated_count;
    const totalCount: number =
      x.relation === "followers"
        ? // @ts-ignore
          x.twitter_profile.followers_count
        : x.relation === "following"
        ? // @ts-ignore
          x.twitter_profile.following_count
        : null;

    return {
      id: parseInt(x.id),
      createdAt: new Date(x.created_at),
      paused: x.paused,
      relation: x.relation,
      // @ts-ignore
      username: x.twitter_profile.username,
      updatedCount,
      totalCount,
      progress: totalCount ? (updatedCount / totalCount) * 100 : null,
    };
  });
};

export const TwipsJobsProvider = ({
  supabase,
  children,
}: TwipsJobsProviderProps) => {
  const { user } = useTwipsUser();

  const [jobs, jobsHandlers] = useListState<Job>([]);
  const [loading, setLoading] = useState(false);
  const [randomFloat, setRandomFloat] = useState(Math.random());

  // Fetch jobs and update state
  const fetchJobs = async () => {
    setLoading(true);

    let jobs: Job[];
    try {
      jobs = await getJobs(supabase);
    } catch (error) {
      console.log(error);
      showNotification({
        title: "Error",
        message: "Something went wrong",
        color: "red",
      });
      setLoading(false);
      return;
    }

    jobsHandlers.setState(jobs);
    setLoading(false);
  };

  // Handle pausing// unpausing of a job
  const pauseJob = async (id: number, paused: boolean) => {
    try {
      await supabase
        .from("update_relation_job")
        .update({ paused })
        .eq("id", id)
        .throwOnError();
    } catch (error) {
      console.log(error);
      showNotification({
        title: "Error",
        message: "Something went wrong",
        color: "red",
      });
      return;
    }

    // Reload jobs
    await fetchJobs();
  };

  // Handle delete of a job
  const deleteJob = async (id: number) => {
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
        try {
          await supabase
            .from("update_relation_job")
            .delete()
            .eq("id", id)
            .throwOnError();
        } catch (error) {
          console.log(error);
          showNotification({
            title: "Error",
            message: "Something went wrong",
            color: "red",
          });
          return;
        }

        await fetchJobs();
      },
    });
  };

  // Load jobs on first load and if manually refreshed
  useEffect(() => {
    fetchJobs();
  }, [supabase, randomFloat]);

  // Set event handler for checking progress
  useEffect(() => {
    supabase
      .channel(`public:update_relation_job`)
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "update_relation_job",
        },
        (payload) => {
          // Update progress
          jobsHandlers.applyWhere(
            (job) => job.id == payload.new.id,
            (job) => ({
              ...job,
              progress: job.totalCount
                ? (payload.new.updated_count / job.totalCount) * 100
                : null,
            })
          );
        }
      )
      .subscribe();
  }, []);

  return (
    <TwipsJobsContext.Provider
      value={{
        jobs,
        loading,
        pauseJob,
        deleteJob,
        refresh: () => setRandomFloat(Math.random()),
      }}
    >
      {children}
    </TwipsJobsContext.Provider>
  );
};

export const useTwipsJobs = () => useContext(TwipsJobsContext);
