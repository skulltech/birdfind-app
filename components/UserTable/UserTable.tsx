import {
  Anchor,
  Group,
  Stack,
  Table,
  Text,
  Pagination,
  UnstyledButton,
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
  IconSortAscendingNumbers,
  IconSortDescending,
  IconSortDescendingNumbers,
} from "@tabler/icons";

export type UserTableProps = {
  users: TwitterUser[];
};

export const UserTable = ({ users }: UserTableProps) => {
  const [sorting, setSorting] = useState<SortingState>([]);

  const columns = useMemo<ColumnDef<TwitterUser>[]>(
    () => [
      {
        accessorKey: "username",
        header: "Username",
        cell: (info) => (
          <Anchor
            href={"https://twitter.com/" + info.getValue<string>()}
            target="_blank"
          >
            @{info.getValue<string>()}
          </Anchor>
        ),
        enableSorting: false,
      },
      {
        accessorKey: "name",
        header: "Name",
        enableSorting: false,
      },
      {
        accessorKey: "description",
        header: "Bio",
        enableSorting: false,
      },
      {
        accessorKey: "followersCount",
        header: "Followers Count",
        cell: (info) => info.getValue<number>().toString(),
      },
      {
        accessorKey: "followingCount",
        header: "Following Count",
        cell: (info) => info.getValue<number>().toString(),
      },
      {
        accessorKey: "tweetCount",
        header: "Tweets Count",
        cell: (info) => info.getValue<number>().toString(),
      },
      {
        accessorKey: "userCreatedAt",
        header: "Account Creation Date",
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
                    <UnstyledButton
                      onClick={header.column.getToggleSortingHandler()}
                      disabled={!header.column.getCanSort()}
                    >
                      <Group position="apart">
                        {flexRender(
                          header.column.columnDef.header,
                          header.getContext()
                        )}
                        {header.column.getCanSort()
                          ? {
                              asc: <IconSortAscending />,
                              desc: <IconSortDescending />,
                              false: <IconArrowsSort />,
                            }[header.column.getIsSorted() as string] ?? null
                          : null}
                      </Group>
                    </UnstyledButton>
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
