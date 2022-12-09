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
} from "@mantine/core";
import dayjs from "dayjs";
import { Dispatch, SetStateAction, useEffect, useMemo, useState } from "react";
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
import { TwitterProfile } from "@twips/lib";
import { ActionButtonGroup } from "../ActionButtons/ActionButtonGroup";
import {
  IconArrowsSort,
  IconSortAscending,
  IconSortDescending,
} from "@tabler/icons";

const selectLimit = 10;

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
    <tr className={selected && classes.rowSelected} {...others}>
      {children}
    </tr>
  );
};

export type UserTableProps = {
  users: TwitterProfile[];
  selectedUsers: TwitterProfile[];
  setSelectedUsers: Dispatch<SetStateAction<TwitterProfile[]>>;
};

export const UserTable = ({
  users,
  selectedUsers,
  setSelectedUsers,
}: UserTableProps) => {
  const [sorting, setSorting] = useState<SortingState>([]);
  const [rowSelection, setRowSelection] = useState({});
  const [selectDisabled, setSelectDisabled] = useState(false);

  const { classes, cx } = useStyles();
  const [scrolled, setScrolled] = useState(false);

  // Set selected users
  useEffect(() => {
    const indices = Object.keys(rowSelection).map((x) => parseInt(x));

    if (indices.length >= selectLimit) setSelectDisabled(true);
    else setSelectDisabled(false);

    const selectedUsers: TwitterProfile[] = [];
    for (const i of indices) selectedUsers.push(users[i]);
    setSelectedUsers(selectedUsers);
  }, [rowSelection, users, setSelectedUsers]);

  const columns = useMemo<ColumnDef<TwitterProfile>[]>(
    () => [
      {
        id: "select",
        header: ({ table }) => (
          <Checkbox
            size="xs"
            checked={table.getIsAllRowsSelected()}
            onChange={table.getToggleAllRowsSelectedHandler()}
            transitionDuration={0}
            indeterminate={table.getIsSomeRowsSelected()}
            disabled={users.length > 10}
          />
        ),
        cell: ({ row }) => (
          <Checkbox
            size="xs"
            checked={row.getIsSelected()}
            onChange={row.getToggleSelectedHandler()}
            transitionDuration={0}
            disabled={!row.getIsSelected() && selectDisabled}
          />
        ),
        size: 10,
        enableSorting: false,
      },
      {
        accessorFn: (row) => row,
        header: "User",
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
    [selectDisabled, users.length]
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
            {Object.keys(rowSelection).length} users selected
          </Text>
          <ActionButtonGroup userIds={selectedUsers.map((x) => x.id)} />
        </Group>
        <Pagination
          size="sm"
          page={table.getState().pagination.pageIndex + 1}
          onChange={(page) => table.setPageIndex(page - 1)}
          total={table.getPageCount()}
        />
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
                  <Text weight={500} align="center">
                    Nothing found
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
