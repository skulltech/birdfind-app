import { CloseButton, Group, Paper, Text } from "@mantine/core";
import { FlattenedFilter, renderFilter } from "../../utils/helpers";

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
          size="sm"
          radius="lg"
          variant="outline"
          onClick={() => onClose(filter)}
        />
      </Group>
    </Paper>
  );
};
