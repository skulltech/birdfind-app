import yargs from "yargs";
import { hideBin } from "yargs/helpers";
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
  .demandCommand()
  .help().argv;
