import { Group } from "@mantine/core";
import { Chip } from "../Chip";
import { Entity } from "./EntityInput";

type ParamChipGroupProps = {
  keywords: string[];
  entities: Entity[];
  setKeywords?: (keywords: string[]) => void;
  setEntities?: (entities: Entity[]) => void;
};

export const ParamChipGroup = ({
  keywords,
  entities,
  setKeywords,
  setEntities,
}: ParamChipGroupProps) => {
  return (
    <Group>
      {keywords.map((keyword) => (
        <Chip
          label={`Keyword: "${keyword}"`}
          key={keyword}
          onClose={
            setKeywords
              ? () => setKeywords(keywords.filter((x) => x !== keyword))
              : null
          }
        />
      ))}
      {entities.map((entity) => (
        <Chip
          label={"Niche: " + entity.name}
          key={entity.id.toString()}
          onClose={
            setEntities
              ? () => setEntities(entities.filter((x) => x.id !== entity.id))
              : null
          }
        />
      ))}
    </Group>
  );
};
