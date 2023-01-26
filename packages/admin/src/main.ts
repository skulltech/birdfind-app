import yargs from "yargs";
import { hideBin } from "yargs/helpers";
import { loadEntities } from "./load-entities";
import {
  analyzeUser,
  createLookupCircleJob,
  iterateLookupCircleJob,
} from "./lookup-circle";
import { lookupTwitterUser } from "./lookup-twitter-user";

// Monkeypatching types for JSON serialization
BigInt.prototype["toJSON"] = function () {
  return this.toString();
};
Set.prototype["toJSON"] = function () {
  return Array.from(this);
};
Date.prototype["toJSON"] = function () {
  return this.toISOString();
};

// To suppress warnings
process.removeAllListeners("warning");

yargs(hideBin(process.argv))
  .command({
    command: "lookup-twitter-user",
    describe: "Lookup Twitter user by ID",
    builder: (yargs) =>
      yargs.positional("id", {
        type: "string",
        demandOption: true,
        description: "Twitter ID of the user",
      }),
    handler: async (argv) => {
      const id = argv._[1] as string;
      console.info("Looking up Twitter user", id);
      await lookupTwitterUser(id);
      console.info("Finished looking up Twitter user");
      // Because it might hang
      process.exit();
    },
  })
  .command({
    command: "iterate-lookup-circle",
    describe: "Lookup Twitter circle by user",
    builder: (yargs) =>
      yargs.positional("jobId", {
        type: "string",
        demandOption: true,
        description: "Job ID",
      }),
    handler: async (argv) => {
      const jobId = argv._[1] as number;
      await iterateLookupCircleJob(jobId);
      // Because it might hang
      process.exit();
    },
  })
  .command({
    command: "create-lookup-circle",
    describe: "Lookup Twitter circle by user",
    builder: (yargs) =>
      yargs.positional("username", {
        type: "string",
        demandOption: true,
        description: "Seed username",
      }),
    handler: async (argv) => {
      const username = argv._[1] as string;
      await createLookupCircleJob(username);
      // Because it might hang
      process.exit();
    },
  })
  .command({
    command: "analyze-user",
    describe: "Analyze user's niche",
    builder: (yargs) =>
      yargs.positional("username", {
        type: "string",
        demandOption: true,
      }),
    handler: async (argv) => {
      const username = argv._[1] as string;
      await analyzeUser(username);
      // Because it might hang
      process.exit();
    },
  })
  .command({
    command: "load-entities",
    describe: "Analyze user's niche",
    handler: async (argv) => {
      await loadEntities();
      // Because it might hang
      process.exit();
    },
  })
  .demandCommand()
  .help().argv;
