import { getUserProfileEventListener, runAddJobsLoop } from "./utils";

// Run loops for adding jobs
runAddJobsLoop("lookup-relation");
runAddJobsLoop("manage-list-members");
runAddJobsLoop("manage-relation");

// Add event listener
getUserProfileEventListener().subscribe();
