import { CloseButton, createStyles, Group, Paper, Text } from "@mantine/core";

export type FilterChipProps = {
  label: string;
  onClose: () => void;
};

const useStyles = createStyles((theme) => ({
  filterChip: {
    height: 30,
    display: "flex",
    "&:hover": {
      backgroundColor:
        theme.colorScheme === "dark"
          ? theme.colors.dark[6]
          : theme.colors.gray[0],
    },
  },
}));

export const Chip = ({ label, onClose }: FilterChipProps) => {
  const { classes } = useStyles();

  return (
    <Paper
      shadow="md"
      withBorder
      radius="lg"
      px="xs"
      className={classes.filterChip}
    >
      <Group position="apart" grow={false} noWrap spacing="xs">
        <Text>{label}</Text>
        <CloseButton
          size="xs"
          radius="lg"
          variant="outline"
          onClick={onClose}
        />
      </Group>
    </Paper>
  );
};
