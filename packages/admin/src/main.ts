import yargs from "yargs";
import { hideBin } from "yargs/helpers";
import { lookupTwitterUser } from "./lookup-twitter-user";
import { removeEvents } from "./remove-events";

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
    command: "remove-events",
    describe: "Remove events of a user",
    builder: (yargs) =>
      yargs.positional("email", {
        type: "string",
        demandOption: true,
        description: "Email of the user",
      }),
    handler: async (argv) => {
      const email = argv._[1] as string;
      console.info("Removing events of user", email);
      await removeEvents(email);
      console.info("Removed events of user", email);
      // Because it might hang
      process.exit();
    },
  })
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
  .demandCommand()
  .help().argv;
