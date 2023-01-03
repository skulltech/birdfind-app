import { Text } from "@mantine/core";
import { useListState } from "@mantine/hooks";
import { openConfirmModal } from "@mantine/modals";
import { showNotification } from "@mantine/notifications";
import { SupabaseClient } from "@supabase/supabase-js";
import { JobName, jobNames } from "@twips/common";
import {
  createContext,
  ReactNode,
  useContext,
  useEffect,
  useState,
} from "react";

export type Job = {
  id: number;
  name: JobName;
  createdAt: Date;
  label: string;
  paused: boolean;
  finished: boolean;
  progress?: number;
  totalCount?: number;
};

const TwipsJobsContext = createContext<{
  jobs: Job[];
  loading: boolean;
  pauseJob: (name: JobName, id: number, paused: boolean) => Promise<void>;
  deleteJob: (name: JobName, id: number) => Promise<void>;
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
  const { data: lookupRelationJobsData } = await supabase
    .from("lookup_relation_job")
    .select(
      `id,created_at,paused,relation,updated_count,finished,
        twitter_profile (username,followers_count,following_count)`
    )
    .eq("finished", false)
    .eq("deleted", false)
    .order("created_at", { ascending: false })
    .throwOnError();

  const lookupRelationJobs: Job[] = lookupRelationJobsData.map((x) => {
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
      name: "lookup-relation",
      label: `Fetch ${
        x.relation == "blocking"
          ? "blocklist"
          : x.relation == "muting"
          ? "mutelist"
          : x.relation
        // @ts-ignore
      } of @${x.twitter_profile.username}`,
      createdAt: new Date(x.created_at),
      paused: x.paused,
      totalCount,
      progress: totalCount ? (updatedCount / totalCount) * 100 : null,
      finished: x.finished,
    };
  });

  const { data: manageListMembersJobsData } = await supabase
    .from("manage_list_members_job")
    .select(
      `id,created_at,paused,member_ids,member_ids_done,finished,
        twitter_list (name)`
    )
    .eq("finished", false)
    .eq("deleted", false)
    .order("created_at", { ascending: false })
    .throwOnError();

  const manageListMembersJobs: Job[] = manageListMembersJobsData.map(
    (x: any) => {
      return {
        id: parseInt(x.id),
        name: "manage-list-members",
        label: `Add ${x.member_ids.length} users to list "${x.twitter_list.name}"`,
        createdAt: new Date(x.created_at),
        paused: x.paused,
        progress: (x.member_ids_done.length / x.member_ids.length) * 100,
        finished: x.finished,
      };
    }
  );

  return [...lookupRelationJobs, ...manageListMembersJobs];
};

export const TwipsJobsProvider = ({
  supabase,
  children,
}: TwipsJobsProviderProps) => {
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
  const pauseJob = async (name: JobName, id: number, paused: boolean) => {
    try {
      await supabase
        .from(
          name == "lookup-relation"
            ? "lookup_relation_job"
            : name == "manage-list-members"
            ? "manage_list_members_job"
            : name == "manage-relation"
            ? "manage_relation_job"
            : null
        )
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
  const deleteJob = async (name: JobName, id: number) => {
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
            .from(
              name == "lookup-relation"
                ? "lookup_relation_job"
                : name == "manage-list-members"
                ? "manage_list_members_job"
                : name == "manage-relation"
                ? "manage_relation_job"
                : null
            )
            .update({ deleted: true })
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

  // Set event handlers for checking progress of jobs
  useEffect(() => {
    for (const name of jobNames) {
      const table =
        name == "lookup-relation"
          ? "lookup_relation_job"
          : name == "manage-list-members"
          ? "manage_list_members_job"
          : name == "manage-relation"
          ? "manage_relation_job"
          : null;

      // Subscribe to channel
      supabase
        .channel(`public:${table}`)
        .on(
          "postgres_changes",
          {
            event: "UPDATE",
            schema: "public",
            table,
          },
          (payload) => {
            // Update progress
            jobsHandlers.applyWhere(
              (job) => job.id == payload.new.id && job.name == name,
              (job) => ({
                ...job,
                progress:
                  // Set progress
                  name == "lookup-relation"
                    ? job.totalCount
                      ? (payload.new.updated_count / job.totalCount) * 100
                      : null
                    : name == "manage-list-members"
                    ? (payload.new.member_ids_done.length /
                        payload.new.member_ids.length) *
                      100
                    : name == "manage-relation"
                    ? (payload.new.target_ids_done.length /
                        payload.new.target_ids.length) *
                      100
                    : null,
                finished: payload.new.finished,
              })
            );
          }
        )
        .subscribe();
    }
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
