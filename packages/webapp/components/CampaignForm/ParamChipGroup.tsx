import { Group } from "@mantine/core";
import { Entity, Keyword } from "../../utils/campaigns";
import { Chip } from "../Chip";

type ParamChipGroupProps = {
  keywords: Keyword[];
  entities: Entity[];
  setKeywords?: (keywords: Keyword[]) => void;
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
          label={`${
            keyword.isPositive ? "Include" : "Do not include"
          } keyword: "${keyword.keyword}"`}
          key={keyword.keyword + keyword.isPositive}
          onClose={
            setKeywords
              ? () =>
                  setKeywords(
                    keywords.filter(
                      (x) =>
                        x.isPositive !== keyword.isPositive &&
                        x.keyword !== keyword.keyword
                    )
                  )
              : null
          }
        />
      ))}
      {entities.map((entity) => (
        <Chip
          label={`${entity.isPositive ? "Include" : "Do not include"} niche: ${
            entity.name
          }`}
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
