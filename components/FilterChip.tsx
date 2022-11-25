import { CloseButton, Group, Paper, Text } from "@mantine/core";
import { FlattenedFilter, renderFilter } from "./helpers";

export type FilterChipProps = {
  filter: FlattenedFilter;
  onClose: any;
};

export const FilterChip = ({ filter, onClose }: FilterChipProps) => {
  return (
    <Paper shadow="md" radius="lg" withBorder p="sm">
      <Group position="apart" grow={false}>
        <Text>{renderFilter(filter)}</Text>
        <CloseButton
          title="Remove filter"
          size="sm"
          radius="lg"
          variant="outline"
          onClick={() => onClose(filter)}
        />
      </Group>
    </Paper>
  );
};
