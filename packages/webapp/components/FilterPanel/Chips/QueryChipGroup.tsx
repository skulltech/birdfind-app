import { Queries } from "../../../utils/helpers";
import { Chip } from "./Chip";

type Chip = {
  label: string;
};

type QueryChipGroupProps = {
  queries: Queries;
  setQueries: (queries: Queries) => void;
};

export const QueryChipGroup = ({
  queries,
  setQueries,
}: QueryChipGroupProps) => {
  return (
    <>
      {queries.map(([name, value], index) => (
        <Chip
          key={index}
          label={
            name == "followerOf"
              ? `Follower of @${value}`
              : `Followed by @${value}`
          }
          onClose={() => setQueries(queries.filter((_, i) => i !== index))}
        />
      ))}
    </>
  );
};
