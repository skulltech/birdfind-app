import * as csv from "@fast-csv/parse";
const pgp = require("pg-promise")();

export const loadEntities = async () => {
  const db = pgp(process.env.PG_CONNECTION);
  const entitiesCs = new pgp.helpers.ColumnSet(["id", "name"], {
    table: "twitter_entities",
  });
  const domainsEntitiesCs = new pgp.helpers.ColumnSet(
    ["entity_id", "domain_id"],
    { table: "twitter_domains_entities" }
  );
  const entities = [];
  const domainsEntities = [];

  return new Promise((resolve, reject) => {
    csv
      .parseFile("../../../evergreen-context-entities-20220601.csv", {
        headers: true,
      })
      .on("error", reject)
      .on("data", (row) => {
        entities.push({ id: row.entity_id, name: row.entity_name.trim() });
        row.domains.split(",").forEach((domain: string) => {
          domainsEntities.push({
            entity_id: row.entity_id,
            domain_id: domain,
          });
        });
      })
      .on("end", () => {
        console.log("Inserting", entities.length, "entities");
        const insertEntities =
          pgp.helpers.insert(entities, entitiesCs) + " on conflict do nothing";
        const insertDomainsEntities =
          pgp.helpers.insert(domainsEntities, domainsEntitiesCs) +
          " on conflict do nothing";
        db.none([insertEntities, insertDomainsEntities].join(";"))
          .then(() => resolve)
          .catch((error) => reject(error));
      });
  });
};
