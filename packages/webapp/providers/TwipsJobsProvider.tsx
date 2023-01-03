import { Text } from "@mantine/core";
import { useListState } from "@mantine/hooks";
import { openConfirmModal } from "@mantine/modals";
import { showNotification } from "@mantine/notifications";
import {
  RealtimePostgresChangesPayload,
  SupabaseClient,
} from "@supabase/supabase-js";
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
  progress?: number;
  totalCount?: number;
};

const TwipsJobsContext = createContext<{
  jobs: Job[];
  loading: boolean;
  pauseJob: (name: JobName, id: number, paused: boolean) => Promise<void>;
  deleteJob: (name: JobName, id: number) => Promise<void>;
}>({
  jobs: [],
  loading: false,
  pauseJob: async () => {},
  deleteJob: async () => {},
});

interface TwipsJobsProviderProps {
  supabase: SupabaseClient;
  children: ReactNode;
}

const parseLookupRelationJob = (job: any): Job => {
  const updatedCount: number = job.updated_count;
  const totalCount: number =
    job.relation === "followers"
      ? job.twitter_profile.followers_count
      : job.relation === "following"
      ? job.twitter_profile.following_count
      : null;
  return {
    id: parseInt(job.id),
    name: "lookup-relation",
    label: `Fetch ${
      job.relation == "blocking"
        ? "blocklist"
        : job.relation == "muting"
        ? "mutelist"
        : job.relation
    } of @${job.twitter_profile.username}`,
    createdAt: new Date(job.created_at),
    paused: job.paused,
    totalCount,
    progress: totalCount ? (updatedCount / totalCount) * 100 : null,
  };
};

const parseManageListMembersJob = (job: any): Job => ({
  id: parseInt(job.id),
  name: "manage-list-members",
  label: `Add ${job.member_ids.length} users to list "${job.twitter_list.name}"`,
  createdAt: new Date(job.created_at),
  paused: job.paused,
  progress: (job.member_ids_done.length / job.member_ids.length) * 100,
});

const getJobById = async (
  supabase: SupabaseClient,
  name: JobName,
  id: BigInt
) => {
  if (name == "lookup-relation") {
    const { data } = await supabase
      .from("lookup_relation_job")
      .select(
        `id,created_at,paused,relation,updated_count,finished,
        twitter_profile (username,followers_count,following_count)`
      )
      .eq("id", id)
      .throwOnError()
      .single();
    return parseLookupRelationJob(data);
  }

  if (name == "manage-list-members") {
    const { data } = await supabase
      .from("manage_list_members_job")
      .select(
        `id,created_at,paused,member_ids,member_ids_done,
        twitter_list (name)`
      )
      .eq("id", id)
      .throwOnError()
      .single();
    return parseManageListMembersJob(data);
  }
};

const getJobs = async (supabase: SupabaseClient): Promise<Job[]> => {
  const { data: lookupRelationJobs } = await supabase
    .from("lookup_relation_job")
    .select(
      `id,created_at,paused,relation,updated_count,finished,
        twitter_profile (username,followers_count,following_count)`
    )
    .eq("finished", false)
    .eq("deleted", false)
    .order("created_at", { ascending: false })
    .throwOnError();

  const { data: manageListMembersJobs } = await supabase
    .from("manage_list_members_job")
    .select(
      `id,created_at,paused,member_ids,member_ids_done,
        twitter_list (name)`
    )
    .eq("finished", false)
    .eq("deleted", false)
    .order("created_at", { ascending: false })
    .throwOnError();

  return [
    ...lookupRelationJobs.map(parseLookupRelationJob),
    ...manageListMembersJobs.map(parseManageListMembersJob),
  ];
};

export const TwipsJobsProvider = ({
  supabase,
  children,
}: TwipsJobsProviderProps) => {
  const [jobs, jobsHandlers] = useListState<Job>([]);
  const [loading, setLoading] = useState(false);

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

  // Load jobs on first load
  useEffect(() => {
    fetchJobs();
  }, []);

  // Set event handlers
  useEffect(() => {
    const handlePayload = async (
      name: JobName,
      payload: RealtimePostgresChangesPayload<any>
    ) => {
      if (payload.eventType == "UPDATE") {
        if (payload.new.finished) {
          // Remove job and show notification
          const job = await getJobById(supabase, name, payload.new.id);
          jobsHandlers.filter((job) => job.id !== payload.new.id);
          showNotification({
            title: "Job finished",
            message: `${job.label} has finished!`,
            color: "green",
          });
        }
        // Update progress
        else
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
            })
          );
      }

      if (payload.eventType == "INSERT") {
        const job = await getJobById(supabase, name, payload.new.id);
        jobsHandlers.append(job);
        showNotification({
          title: "Job added",
          message: `${job.label} has started!`,
          color: "green",
        });
      }
    };

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
            event: "*",
            schema: "public",
            table,
          },
          (payload) => handlePayload(name, payload)
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
      }}
    >
      {children}
    </TwipsJobsContext.Provider>
  );
};

export const useTwipsJobs = () => useContext(TwipsJobsContext);
