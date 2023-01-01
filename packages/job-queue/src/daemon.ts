import { getJobEventListener, runAddJobsLoop } from "./utils";

// Run loops for adding jobs
runAddJobsLoop("update-relation");
runAddJobsLoop("add-list-members");

// Add event listeners
getJobEventListener("update-relation").subscribe();
getJobEventListener("add-list-members").subscribe();
