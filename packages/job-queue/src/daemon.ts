import {
  addRefreshTwitterTokensCron,
  getUserProfileEventListener,
  runAddJobsLoop,
} from "./utils";

// Add cron for refreshing Twitter tokens
addRefreshTwitterTokensCron();

// Run loops for adding jobs
runAddJobsLoop("lookup-relation");
runAddJobsLoop("manage-list-members");
runAddJobsLoop("manage-relation");

// Add event listener
getUserProfileEventListener().subscribe();
