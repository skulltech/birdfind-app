import { addAddListMembersJob } from "./add-list-members/add-jobs";
import { addListMembersJobEventListener } from "./add-list-members/event-listener";
import { addUpdateRelationJobs } from "./update-relation/add-jobs";
import { updateRelationJobEventListener } from "./update-relation/event-listener";
import { logger } from "./utils";

// Run loop for adding update-relation jobs
addUpdateRelationJobs().catch((error) =>
  logger.error("Error at daemon while adding update-relation jobs", {
    metadata: { error },
  })
);

// Run loop for adding add-list-members jobs
addAddListMembersJob().catch((error) =>
  logger.error("Error at daemon while adding add-list-members jobs", {
    metadata: { error },
  })
);

// Add event listener for changes in update_relation_job
updateRelationJobEventListener.subscribe();

// Add event listener for changes in add_list_members_job
addListMembersJobEventListener.subscribe();
