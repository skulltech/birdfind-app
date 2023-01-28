import { getUserProfileEventListener, addRunCampaignJobs } from "./utils";

// Run loops for adding jobs
addRunCampaignJobs();

// Add event listener
getUserProfileEventListener().subscribe();
