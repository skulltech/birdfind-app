import { Group, Stack, Text, Pagination, Checkbox } from "@mantine/core";
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
import { CustomTable, Th } from "./CustomTable";
import { TwitterProfile } from "@twips/lib";
import { ActionForm } from "../ActionForm";

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
            checked={table.getIsAllRowsSelected()}
            onChange={table.getToggleAllRowsSelectedHandler()}
            transitionDuration={0}
            indeterminate={table.getIsSomeRowsSelected()}
          />
        ),
        cell: ({ row }) => (
          <Checkbox
            checked={row.getIsSelected()}
            onChange={row.getToggleSelectedHandler()}
            transitionDuration={0}
          />
        ),
      },
      {
        accessorFn: (row) => row,
        header: "Profile",
        cell: (info) => (
          <UserProfileCard
            username={info.getValue<TwitterProfile>().username}
            name={info.getValue<TwitterProfile>().name}
            description={info.getValue<TwitterProfile>().description}
            profileImageUrl={info.getValue<TwitterProfile>().profileImageUrl}
          />
        ),
        enableSorting: false,
        size: 200,
      },
      {
        accessorKey: "followersCount",
        header: "Followers",
        cell: (info) => info.getValue<number>().toString(),
      },
      {
        accessorKey: "followingCount",
        header: "Following",
        cell: (info) => info.getValue<number>().toString(),
      },
      {
        accessorKey: "tweetCount",
        header: "Tweets",
        cell: (info) => info.getValue<number>().toString(),
      },
      {
        accessorKey: "userCreatedAt",
        header: "Account Created On",
        cell: (info) => dayjs(info.getValue<Date>()).format("DD MMM YYYY"),
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
    debugTable: true,
  });

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
      <tr key={row.id}>
        {row.getAllCells().map((cell) => {
          return (
            <td key={cell.id}>
              {flexRender(cell.column.columnDef.cell, cell.getContext())}
            </td>
          );
        })}
      </tr>
    );
  });

  return (
    <Stack>
      <Group position="apart">
        <Group>
          <Text>
            {Object.keys(rowSelection).length} of {users.length} users selected
          </Text>
          <ActionForm userIds={selectedUsers.map((x) => x.id)} />
        </Group>
        <Pagination
          page={table.getState().pagination.pageIndex + 1}
          onChange={(page) => table.setPageIndex(page - 1)}
          total={table.getPageCount()}
        />
      </Group>
      <CustomTable
        headers={headers}
        rows={rows}
        tableProps={{ striped: true, highlightOnHover: true }}
        numCols={6}
      />
    </Stack>
  );
};
