import { CloseButton, Group, Paper, Text } from "@mantine/core";
import { FlattenedFilter, renderFilter } from "../../utils/components";

export type FilterChipProps = {
  filter: FlattenedFilter;
  onClose: any;
};

export const FilterChip = ({ filter, onClose }: FilterChipProps) => {
  return (
    <Paper shadow="md" radius="lg" withBorder p="xs">
      <Group position="apart" grow={false}>
        <Text size="sm">{renderFilter(filter)}</Text>
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
