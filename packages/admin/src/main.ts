import { relations } from "@twips/common";
import yargs from "yargs";
import { hideBin } from "yargs/helpers";
import { addJob } from "./add-job";
import { removeEvents } from "./remove-events";

// Monkeypatching BigInt
BigInt.prototype["toJSON"] = function () {
  return this.toString();
};

// To suppress warnings
process.removeAllListeners("warning");

yargs(hideBin(process.argv))
  .command({
    command: "add-job",
    describe: "Add an update-relation job",
    builder: (yargs) =>
      yargs
        .option("relation", {
          alias: "r",
          type: "string",
          choices: relations,
          demandOption: true,
          description: "Relation to update",
        })
        .option("username", {
          alias: "u",
          type: "string",
          demandOption: true,
          description: "Update relations of this username",
        })
        .option("email", {
          alias: "e",
          type: "string",
          demandOption: true,
          description: "Use tokens of this user",
        }),
    handler: async ({ relation, username, email }) => {
      console.info(
        `Adding job to update ${relation} of @${username} using ${email}'s tokens.`
      );
      const jobId = await addJob({ email, relation, username });
      console.info("Added job with ID", jobId);
      // Because it might hang
      process.exit();
    },
  })
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
  .demandCommand()
  .help().argv;
