import { ReactNode } from "react";
import {
  createStyles,
  Table,
  Text,
  UnstyledButton,
  Center,
  Group,
} from "@mantine/core";
import {
  IconArrowsSort,
  IconSortAscending,
  IconSortDescending,
} from "@tabler/icons";

const useStyles = createStyles((theme) => ({
  th: {
    padding: "0 !important",
  },

  control: {
    width: "100%",
    padding: `${theme.spacing.xs}px ${theme.spacing.md}px`,

    "&:hover": {
      backgroundColor:
        theme.colorScheme === "dark"
          ? theme.colors.dark[6]
          : theme.colors.gray[0],
    },
  },

  icon: {
    width: 21,
    height: 21,
    borderRadius: 21,
  },
}));

interface ThProps {
  children: React.ReactNode;
  sorted: false | "asc" | "desc";
  isSortable: boolean;
  onSort: any;
}

export const Th = ({ children, sorted, isSortable, onSort }: ThProps) => {
  const { classes } = useStyles();
  const Icon = sorted
    ? sorted == "asc"
      ? IconSortAscending
      : IconSortDescending
    : IconArrowsSort;
  return (
    <th className={classes.th}>
      <UnstyledButton onClick={onSort} className={classes.control}>
        <Group position="apart">
          <Text weight={500} size="sm">
            {children}
          </Text>
          <Center className={classes.icon}>
            {isSortable ? <Icon size={14} stroke={1.5} /> : null}
          </Center>
        </Group>
      </UnstyledButton>
    </th>
  );
};

interface CustomTableProps {
  headers: ReactNode[];
  rows: ReactNode[];
  numCols: number;
  tableProps: any;
}

export const CustomTable = ({
  headers,
  rows,
  numCols,
  tableProps,
}: CustomTableProps) => {
  return (
    <Table
      horizontalSpacing="md"
      verticalSpacing="xs"
      sx={{ tableLayout: "fixed", minWidth: 700 }}
      {...tableProps}
    >
      <thead>{headers}</thead>
      <tbody>
        {rows.length > 0 ? (
          rows
        ) : (
          <tr>
            <td colSpan={numCols}>
              <Text weight={500} align="center">
                Nothing found
              </Text>
            </td>
          </tr>
        )}
      </tbody>
    </Table>
  );
};
