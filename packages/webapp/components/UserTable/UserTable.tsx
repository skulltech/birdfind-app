import {
  Group,
  Stack,
  Text,
  Pagination,
  Checkbox,
  createStyles,
  Table,
  UnstyledButton,
  Center,
  ScrollArea,
  HoverCard,
  ActionIcon,
} from "@mantine/core";
import dayjs from "dayjs";
import { useEffect, useMemo, useState } from "react";
import {
  ColumnDef,
  flexRender,
  getCoreRowModel,
  getSortedRowModel,
  SortingState,
  useReactTable,
  getPaginationRowModel,
} from "@tanstack/react-table";
import { UserProfileCard } from "./UserProfileCard";
import {
  IconArrowsSort,
  IconRefresh,
  IconSortAscending,
  IconSortDescending,
} from "@tabler/icons";
import { TwitterProfile } from "../../utils/helpers";
import { useTwips } from "../TwipsProvider";
import { ActionMenu } from "./ActionMenu";

const useStyles = createStyles((theme) => ({
  th: {
    padding: "0 !important",
  },

  header: {
    position: "sticky",
    top: 0,
    backgroundColor:
      theme.colorScheme === "dark"
        ? theme.colors.dark[8]
        : theme.colors.gray[0],
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

  rowSelected: {
    backgroundColor:
      theme.colorScheme === "dark"
        ? theme.fn.rgba(theme.colors[theme.primaryColor][7], 0.2)
        : theme.colors[theme.primaryColor][0],
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
  onSort: (event: unknown) => void;
}

export const Th = ({
  children,
  sorted,
  isSortable,
  onSort,
  ...others
}: ThProps) => {
  const { classes } = useStyles();

  const Icon = sorted
    ? sorted == "asc"
      ? IconSortAscending
      : IconSortDescending
    : IconArrowsSort;
  return (
    <th className={classes.th} {...others}>
      <UnstyledButton onClick={onSort} className={classes.control}>
        <Group position="apart" noWrap>
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

interface TrProps {
  children: React.ReactNode;
  selected: boolean;
}

export const Tr = ({ children, selected, ...others }: TrProps) => {
  const { classes } = useStyles();
  return (
    <tr className={selected ? classes.rowSelected : undefined} {...others}>
      {children}
    </tr>
  );
};

export const UserTable = () => {
  const [sorting, setSorting] = useState<SortingState>([]);
  const [rowSelection, setRowSelection] = useState({});
  const { classes, cx } = useStyles();
  const [scrolled, setScrolled] = useState(false);
  const selectedIndices = Object.keys(rowSelection).map((x) => parseInt(x));
  const { searchResults: users, refresh } = useTwips();

  // Custom handler for the check all button
  const checkAllToggleHandler = () => {
    if (selectedIndices.length) setRowSelection({});
    else
      setRowSelection(
        [...Array(10)].reduce((prev, curr, currIndex) => {
          return { ...prev, [currIndex]: true };
        }, {})
      );
  };

  const columns = useMemo<ColumnDef<TwitterProfile>[]>(
    () => [
      {
        id: "select",
        header: ({ table }) => (
          <HoverCard shadow="md">
            <HoverCard.Target>
              <Checkbox
                size="sm"
                checked={selectedIndices.length > 0}
                onChange={checkAllToggleHandler}
                transitionDuration={0}
                indeterminate={
                  selectedIndices.length < 10 && selectedIndices.length > 0
                }
              />
            </HoverCard.Target>
            <HoverCard.Dropdown>
              <Text>Select the first 10 users</Text>
            </HoverCard.Dropdown>
          </HoverCard>
        ),
        cell: ({ row }) => (
          <Checkbox
            size="sm"
            checked={row.getIsSelected()}
            onChange={row.getToggleSelectedHandler()}
            transitionDuration={0}
            disabled={!row.getIsSelected() && selectedIndices.length >= 10}
          />
        ),
        size: 10,
        enableSorting: false,
      },
      {
        accessorFn: (row) => row,
        header: "Profile",
        cell: (info) => (
          <UserProfileCard profile={info.getValue<TwitterProfile>()} />
        ),
        enableSorting: false,
        // size: 80,
      },
      {
        accessorKey: "followersCount",
        header: "Followers",
        cell: (info) => info.getValue<number>().toString(),
        size: 100,
      },
      {
        accessorKey: "followingCount",
        header: "Following",
        cell: (info) => info.getValue<number>().toString(),
        size: 100,
      },
      {
        accessorKey: "tweetCount",
        header: "Tweets",
        cell: (info) => info.getValue<number>().toString(),
        size: 100,
      },
      {
        accessorKey: "userCreatedAt",
        header: "Account Created On",
        cell: (info) => dayjs(info.getValue<Date>()).format("DD MMM YYYY"),
        size: 170,
      },
    ],
    [selectedIndices.length]
  );

  const table = useReactTable<TwitterProfile>({
    data: users,
    columns,
    state: {
      sorting,
      rowSelection,
    },
    onRowSelectionChange: setRowSelection,
    onSortingChange: setSorting,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
  });

  // Set page size when component loads
  useEffect(() => {
    table.setPageSize(100);
  }, []);

  const headers = table.getHeaderGroups().map((headerGroup) => (
    <tr key={headerGroup.id}>
      {headerGroup.headers.map((header) => {
        return (
          <Th
            key={header.id}
            sorted={header.column.getIsSorted()}
            isSortable={header.column.getCanSort()}
            onSort={header.column.getToggleSortingHandler()}
          >
            {flexRender(header.column.columnDef.header, header.getContext())}
          </Th>
        );
      })}
    </tr>
  ));

  const rows = table.getRowModel().rows.map((row) => {
    return (
      <Tr key={row.id} selected={row.getIsSelected()}>
        {row.getAllCells().map((cell) => {
          return (
            <td key={cell.id}>
              {flexRender(cell.column.columnDef.cell, cell.getContext())}
            </td>
          );
        })}
      </Tr>
    );
  });

  return (
    <Stack>
      <Group position="apart">
        <Group>
          <Text size={14}>
            {Object.keys(rowSelection).length} of {users.length} users selected
          </Text>
          <ActionMenu
            userIds={users
              .filter((x, i) => selectedIndices.includes(i))
              .map((x) => x.id)}
          />
        </Group>
        <Group>
          <ActionIcon size="sm" color="blue" onClick={refresh}>
            <IconRefresh />
          </ActionIcon>
          <Pagination
            size="sm"
            page={table.getState().pagination.pageIndex + 1}
            onChange={(page) => table.setPageIndex(page - 1)}
            total={table.getPageCount()}
          />
        </Group>
      </Group>
      <ScrollArea
        sx={{ height: "80vh" }}
        onScrollPositionChange={({ y }) => setScrolled(y !== 0)}
      >
        <Table horizontalSpacing="md" verticalSpacing="xs">
          <thead
            className={cx(classes.header, { [classes.scrolled]: scrolled })}
            style={{ zIndex: 1 }}
          >
            {headers}
          </thead>
          <tbody>
            {rows.length > 0 ? (
              rows
            ) : (
              <tr>
                <td colSpan={6}>
                  <Text size={18} weight={500} align="center">
                    No users found
                  </Text>
                </td>
              </tr>
            )}
          </tbody>
        </Table>
      </ScrollArea>
    </Stack>
  );
};
