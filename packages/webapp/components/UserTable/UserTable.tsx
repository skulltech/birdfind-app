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

const useStyles = createStyles((theme) => ({
  th: {
    padding: "0 !important",
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

  // Set selected users
  useEffect(() => {
    const indices = Object.keys(rowSelection).map((x) => parseInt(x));
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
          />
        ),
        cell: ({ row }) => (
          <Checkbox
            size="xs"
            checked={row.getIsSelected()}
            onChange={row.getToggleSelectedHandler()}
            transitionDuration={0}
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
    []
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
      <Table horizontalSpacing="md" verticalSpacing="xs">
        <thead>{headers}</thead>
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
    </Stack>
  );
};
