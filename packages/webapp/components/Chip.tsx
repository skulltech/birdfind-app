import { CloseButton, createStyles, Group, Paper, Text } from "@mantine/core";
import { useState } from "react";

export type FilterChipProps = {
  label: string;
  onClose: () => Promise<void> | void;
  useLoader?: boolean;
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

export const Chip = ({ label, onClose, useLoader }: FilterChipProps) => {
  const { classes } = useStyles();
  const [loading, setLoading] = useState(false);

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
          loading={useLoader ? loading : false}
          onClick={async () => {
            setLoading(true);
            try {
              await onClose();
            } catch (error) {
              console.error(error);
            }
            setLoading(false);
          }}
        />
      </Group>
    </Paper>
  );
};
