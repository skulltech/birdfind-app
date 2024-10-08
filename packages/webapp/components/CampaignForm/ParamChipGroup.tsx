import { Group } from "@mantine/core";
import { Entity, Keyword } from "../../utils/campaigns";
import { DisplayChip } from "../DisplayChip";

type ParamChipGroupProps = {
  keywords: Keyword[];
  entities: Entity[];
  setKeywords: (keywords: Keyword[]) => void;
  setEntities: (entities: Entity[]) => void;
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
        <DisplayChip
          label={`${
            keyword.isPositive ? "Include" : "Do not include"
          } keyword: "${keyword.keyword}"`}
          key={keyword.keyword + keyword.isPositive}
          onClose={() =>
            setKeywords(
              keywords.filter(
                (x) =>
                  !(
                    x.keyword === keyword.keyword &&
                    x.isPositive === keyword.isPositive
                  )
              )
            )
          }
        />
      ))}
      {entities.map((entity) => (
        <DisplayChip
          label={`${entity.isPositive ? "Include" : "Do not include"} niche: ${
            entity.name
          }`}
          key={entity.id.toString()}
          onClose={() =>
            setEntities(entities.filter((x) => x.id !== entity.id))
          }
        />
      ))}
    </Group>
  );
};
