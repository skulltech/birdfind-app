import yargs from "yargs";
import { hideBin } from "yargs/helpers";
import { loadEntities } from "./load-entities";
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
    describe: "Lookup Twitter user by username",
    builder: (yargs) =>
      yargs.positional("username", {
        type: "string",
        demandOption: true,
        description: "Username of the user",
      }),
    handler: async (argv) => {
      const username = argv._[1] as string;
      console.info("Looking up Twitter user", username);
      await lookupTwitterUser(username);
      console.info("Finished looking up Twitter user");
      // Because it might hang
      process.exit();
    },
  })
  .command({
    command: "load-entities",
    describe: "Load entities from CSV file to database",
    handler: async (argv) => {
      await loadEntities();
      // Because it might hang
      process.exit();
    },
  })
  .demandCommand()
  .help().argv;
