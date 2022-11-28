import { ReactNode, useState } from "react";
import { createStyles, Table, ScrollArea } from "@mantine/core";

const useStyles = createStyles((theme) => ({
  header: {
    position: "sticky",
    top: 0,
    backgroundColor:
      theme.colorScheme === "dark" ? theme.colors.dark[7] : theme.white,
    transition: "box-shadow 150ms ease",

    "&::after": {
      content: '""',
      position: "absolute",
      left: 0,
      right: 0,
      bottom: 0,
      borderBottom: `1px solid ${
        theme.colorScheme === "dark"
          ? theme.colors.dark[3]
          : theme.colors.gray[2]
      }`,
    },
  },

  scrolled: {
    boxShadow: theme.shadows.sm,
  },
}));

interface TableScrollAreaProps {
  headers: ReactNode[];
  rows: ReactNode[];
  tableProps: any;
}

export function TableScrollArea({
  headers,
  rows,
  tableProps,
}: TableScrollAreaProps) {
  const { classes, cx } = useStyles();
  const [scrolled, setScrolled] = useState(false);

  return (
    <ScrollArea
      sx={{ height: "60vh" }}
      onScrollPositionChange={({ y }) => setScrolled(y !== 0)}
    >
      <Table sx={{ minWidth: 700 }} {...tableProps}>
        <thead className={cx(classes.header, { [classes.scrolled]: scrolled })}>
          {headers}
        </thead>
        <tbody>{rows}</tbody>
      </Table>
    </ScrollArea>
  );
}
