import { Group, Stack, Text, Pagination, ActionIcon } from "@mantine/core";
import dayjs from "dayjs";
import { useMemo, useState } from "react";
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
import { TwitterUser } from "../../lib/utils/types";
import { CustomTable, Th } from "./CustomTable";

export type UserTableProps = {
  users: TwitterUser[];
};

export const UserTable = ({ users }: UserTableProps) => {
  const [sorting, setSorting] = useState<SortingState>([]);

  const columns = useMemo<ColumnDef<TwitterUser>[]>(
    () => [
      {
        accessorFn: (row) => row,
        header: "Profile",
        cell: (info) => (
          <UserProfileCard
            username={info.getValue<TwitterUser>().username}
            name={info.getValue<TwitterUser>().name}
            description={info.getValue<TwitterUser>().description}
            profileImageUrl={info.getValue<TwitterUser>().profileImageUrl}
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

  const table = useReactTable<TwitterUser>({
    data: users,
    columns,
    state: {
      sorting,
    },
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
        <Text weight="bold">{users.length + " search results"}</Text>
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
