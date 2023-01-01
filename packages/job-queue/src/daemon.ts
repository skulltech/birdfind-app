import { getJobEventListener, runAddJobsLoop } from "./utils";

// Run loops for adding jobs
runAddJobsLoop("lookup-relation");
runAddJobsLoop("manage-list-members");
runAddJobsLoop("manage-relation");

// Add event listeners
getJobEventListener("lookup-relation").subscribe();
getJobEventListener("manage-list-members").subscribe();
getJobEventListener("manage-relation").subscribe();
