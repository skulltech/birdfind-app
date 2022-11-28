import {
  Group,
  Stack,
  Table,
  Text,
  Pagination,
  ActionIcon,
} from "@mantine/core";
import { TwitterUser } from "../helpers";
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
import {
  IconArrowsSort,
  IconSortAscending,
  IconSortDescending,
} from "@tabler/icons";
import { UserProfileCard } from "./UserProfileCard";

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
        // maxSize: 60,
      },
      {
        accessorKey: "followersCount",
        header: "Followers Count",
        cell: (info) => info.getValue<number>().toString(),
        maxSize: 10,
      },
      {
        accessorKey: "followingCount",
        header: "Following Count",
        cell: (info) => info.getValue<number>().toString(),
        maxSize: 10,
      },
      {
        accessorKey: "tweetCount",
        header: "Tweets Count",
        cell: (info) => info.getValue<number>().toString(),
        maxSize: 10,
      },
      {
        accessorKey: "userCreatedAt",
        header: "Account Creation Date",
        cell: (info) => dayjs(info.getValue<Date>()).format("DD MMM YYYY"),
        maxSize: 30,
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
      <Table striped highlightOnHover>
        <thead>
          {table.getHeaderGroups().map((headerGroup) => (
            <tr key={headerGroup.id}>
              {headerGroup.headers.map((header) => {
                return (
                  <th
                    key={header.id}
                    colSpan={header.colSpan}
                    style={{ width: header.getSize() }}
                  >
                    <Group>
                      {flexRender(
                        header.column.columnDef.header,
                        header.getContext()
                      )}
                      {header.column.getCanSort() ? (
                        <ActionIcon
                          onClick={header.column.getToggleSortingHandler()}
                        >
                          {{
                            asc: <IconSortAscending />,
                            desc: <IconSortDescending />,
                            false: <IconArrowsSort />,
                          }[header.column.getIsSorted() as string] ?? null}
                        </ActionIcon>
                      ) : null}
                    </Group>
                  </th>
                );
              })}
            </tr>
          ))}
        </thead>
        <tbody>
          {table.getRowModel().rows.map((row) => {
            return (
              <tr key={row.id}>
                {row.getAllCells().map((cell) => {
                  return (
                    <td key={cell.id}>
                      {flexRender(
                        cell.column.columnDef.cell,
                        cell.getContext()
                      )}
                    </td>
                  );
                })}
              </tr>
            );
          })}
        </tbody>
      </Table>
    </Stack>
  );
};
