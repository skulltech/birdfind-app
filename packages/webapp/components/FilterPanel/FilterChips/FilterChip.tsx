import { CloseButton, createStyles, Group, Paper, Text } from "@mantine/core";

export type FilterChipProps = {
  label: string;
  onClose: () => void;
};

const useStyles = createStyles((theme) => ({
  filterChip: {
    "&:hover": {
      backgroundColor:
        theme.colorScheme === "dark"
          ? theme.colors.dark[6]
          : theme.colors.gray[0],
    },
  },
}));

export const FilterChip = ({ label, onClose }: FilterChipProps) => {
  const { classes } = useStyles();

  return (
    <Paper shadow="md" withBorder p="xs" className={classes.filterChip}>
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
