import { getJobEventListener, runAddJobsLoop } from "./utils";

// Run loops for adding jobs
runAddJobsLoop("lookup-relation");
runAddJobsLoop("add-list-members");

// Add event listeners
getJobEventListener("lookup-relation").subscribe();
getJobEventListener("add-list-members").subscribe();
