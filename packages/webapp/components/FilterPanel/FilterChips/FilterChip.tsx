import { CloseButton, Group, Paper, Text } from "@mantine/core";

export type FilterChipProps = {
  label: string;
  onClose: () => void;
};

export const FilterChip = ({ label, onClose }: FilterChipProps) => {
  return (
    <Paper shadow="md" withBorder p="xs">
      <Group position="apart" grow={false} noWrap>
        <Text>{label}</Text>
        <CloseButton
          size="sm"
          radius="lg"
          variant="outline"
          onClick={onClose}
        />
      </Group>
    </Paper>
  );
};
