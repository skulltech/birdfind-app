import { Text } from "@mantine/core";
import { useListState } from "@mantine/hooks";
import { openConfirmModal } from "@mantine/modals";
import { showNotification } from "@mantine/notifications";
import { useSupabaseClient } from "@supabase/auth-helpers-react";
import { RealtimePostgresChangesPayload } from "@supabase/supabase-js";
import { JobName, jobNames } from "@twips/common";
import { createContext, useContext, useEffect, useState } from "react";
import { Job } from "../utils/helpers";
import { getAllJobs, getJob } from "../utils/supabase";
import { useUser } from "./UserProvider";

const JobsContext = createContext<{
  jobs: Job[];
  loading: boolean;
  pauseJob: (name: JobName, id: number, paused: boolean) => Promise<void>;
  deleteJob: (name: JobName, id: number) => Promise<void>;
  jobsUpdatedMarker: number;
}>({
  jobs: [],
  loading: false,
  pauseJob: async () => {},
  deleteJob: async () => {},
  jobsUpdatedMarker: 0,
});

export const JobsProvider = ({ children }) => {
  const [jobs, jobsHandlers] = useListState<Job>([]);
  const [loading, setLoading] = useState(false);
  const supabase = useSupabaseClient();
  const { user } = useUser();
  const [randomFloat, setRandomFloat] = useState(0);

  // Fetch jobs and update state
  const fetchJobs = async () => {
    if (!user) {
      jobsHandlers.setState([]);
      return;
    }

    setLoading(true);

    try {
      const jobs = await getAllJobs(supabase, user.id);
      jobsHandlers.setState(jobs);
    } catch (error) {
      console.log(error);
      showNotification({
        title: "Error",
        message: "Something went wrong",
        color: "red",
      });
    }

    setLoading(false);
  };

  // Handle pausing// unpausing of a job
  const pauseJob = async (name: JobName, id: number, paused: boolean) => {
    const { error } = await supabase
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
      .eq("id", id);
    if (error) {
      console.log(error);
      showNotification({
        title: "Error",
        message: "Something went wrong",
        color: "red",
      });
    }
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
        const { error } = await supabase
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
          .eq("id", id);
        if (error) {
          console.log(error);
          showNotification({
            title: "Error",
            message: "Something went wrong",
            color: "red",
          });
        }
      },
    });
  };

  // Load jobs on first load
  useEffect(() => {
    fetchJobs();
  }, [user]);

  // Set event handlers
  useEffect(() => {
    const handlePayload = async (
      name: JobName,
      payload: RealtimePostgresChangesPayload<any>
    ) => {
      if (payload.eventType == "UPDATE") {
        // Refresh search results quietly
        setRandomFloat(Math.random());

        if (payload.new.finished) {
          jobsHandlers.filter(
            (job) => job.id !== payload.new.id && job.name === name
          );

          if (name != "lookup-relation") {
            const job = await getJob(supabase, name, payload.new.id);
            showNotification({
              title: "Finished job",
              message: job.label,
              color: "green",
            });
          }
        } else if (payload.new.deleted)
          jobsHandlers.filter(
            (job) => job.id !== payload.new.id && job.name === name
          );
        else
          jobsHandlers.applyWhere(
            (job) => job.id == payload.new.id && job.name == name,
            (job) => ({
              ...job,
              paused: payload.new.paused,
              progress:
                // Set progress
                name == "lookup-relation"
                  ? job.metadata.totalCount
                    ? (payload.new.updated_count / job.metadata.totalCount) *
                      100
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
        const job = await getJob(supabase, name, payload.new.id);
        jobsHandlers.append(job);
        if (name != "lookup-relation")
          showNotification({
            title: "Added job",
            message: job.label,
            color: "green",
          });
      }
    };

    if (user)
      for (const name of jobNames) {
        const table =
          name == "lookup-relation"
            ? "lookup_relation_job"
            : name == "manage-list-members"
            ? "manage_list_members_job"
            : name == "manage-relation"
            ? "manage_relation_job"
            : null;
        const filter = `user_id=eq.${user.id}`;

        // Subscribe to channel
        supabase
          .channel(`public:${table}:${filter}`)
          .on(
            "postgres_changes",
            {
              event: "*",
              schema: "public",
              table,
              filter,
            },
            (payload) => handlePayload(name, payload)
          )
          .subscribe();
      }
  }, [user]);

  return (
    <JobsContext.Provider
      value={{
        jobs,
        loading,
        pauseJob,
        deleteJob,
        jobsUpdatedMarker: randomFloat,
      }}
    >
      {children}
    </JobsContext.Provider>
  );
};

export const useJobs = () => useContext(JobsContext);
