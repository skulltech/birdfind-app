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
  ActionIcon,
  Button,
  LoadingOverlay,
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
  PaginationState,
} from "@tanstack/react-table";
import { UserProfileCard } from "./UserProfileCard";
import {
  IconAlertCircle,
  IconArrowsSort,
  IconChevronDown,
  IconRefresh,
  IconSortAscending,
  IconSortDescending,
} from "@tabler/icons";
import { TwitterProfile } from "../../utils/helpers";
import { ActionMenu } from "./ActionMenu";
import { SearchResult } from "../../utils/supabase";
import { RelationsCell } from "./RelationsCell";
import axios from "axios";
import { showNotification } from "@mantine/notifications";
import { useSupabaseClient } from "@supabase/auth-helpers-react";

const useStyles = createStyles((theme) => ({
  th: {
    padding: "0 !important",
  },

  headerGroup: {
    backgroundColor:
      theme.colorScheme === "dark"
        ? theme.colors.dark[8]
        : theme.colors.gray[0],
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
    padding: `${theme.spacing.xs}px ${theme.spacing.xs}px`,
    color: "inherit",

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
      {isSortable ? (
        <UnstyledButton onClick={onSort} className={classes.control}>
          <Group position="apart" noWrap spacing={0}>
            <Text weight={500} size="sm" sx={{ whiteSpace: "nowrap" }}>
              {children}
            </Text>
            <Center className={classes.icon}>
              <Icon size={14} stroke={1.5} />
            </Center>
          </Group>
        </UnstyledButton>
      ) : (
        <Group className={classes.control}>
          <Text weight={500} size="sm" sx={{ whiteSpace: "nowrap" }}>
            {children}
          </Text>
        </Group>
      )}
    </th>
  );
};

type UserTableProps = {
  filtersSufficient: boolean;
  // Search results and pagination
  results: SearchResult[];
  count: number;
  pageIndex: number;
  setPageIndex: Dispatch<SetStateAction<number>>;
  // Loading and refresh
  loading: boolean;
  refresh: (silent?: boolean) => void;
};

export const UserTable = ({
  results,
  refresh,
  pageIndex,
  count,
  setPageIndex,
  loading,
  filtersSufficient,
}: UserTableProps) => {
  const [sorting, setSorting] = useState<SortingState>([]);
  const [rowSelection, setRowSelection] = useState({});
  const { classes, cx } = useStyles();
  const [scrolled, setScrolled] = useState(false);

  const supabase = useSupabaseClient();
  const [lists, setLists] = useState<any[]>(null);
  const [refreshListsLoading, setRefreshListsLoading] = useState(false);

  const pagination = useMemo<PaginationState>(
    () => ({
      pageIndex,
      pageSize: 100,
    }),
    [pageIndex]
  );

  // Refresh lists
  const refreshLists = async () => {
    setRefreshListsLoading(true);

    try {
      const response = await axios.get("/api/twips/lookup-lists");
      const lists = response.data.map((x: any) => {
        return { ...x, id: BigInt(x.id) };
      });
      setLists(lists);
    } catch (error) {
      console.log(error);
      showNotification({
        title: "Error",
        message: "Some error ocurred",
        color: "red",
      });
    }

    setRefreshListsLoading(false);
  };

  // Fetch user owned lists from DB on first load
  useEffect(() => {
    const fetchLists = async () => {
      const { data } = await supabase
        .from("twitter_list")
        .select("id::text,name")
        .throwOnError();

      const lists = data.map((x: any) => {
        return { ...x, id: BigInt(x.id) };
      });
      setLists(lists);
    };

    fetchLists();
  }, [supabase]);

  const columns = useMemo<ColumnDef<SearchResult>[]>(
    () => [
      {
        id: "select",
        header: ({ table }) => (
          <Checkbox
            size="sm"
            checked={table.getIsAllPageRowsSelected()}
            onChange={table.getToggleAllPageRowsSelectedHandler()}
            transitionDuration={0}
            indeterminate={table.getIsSomePageRowsSelected()}
            styles={{
              root: {
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              },
            }}
          />
        ),
        cell: ({ row }) => (
          <Checkbox
            size="sm"
            checked={row.getIsSelected()}
            onChange={row.getToggleSelectedHandler()}
            transitionDuration={0}
            styles={{
              root: {
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              },
            }}
          />
        ),
        enableSorting: false,
      },
      {
        accessorFn: (row) => row,
        header: "Profile",
        cell: (info) => (
          <UserProfileCard profile={info.getValue<TwitterProfile>()} />
        ),
        enableSorting: false,
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
        header: "Joined On",
        cell: (info) => dayjs(info.getValue<Date>()).format("DD MMM YYYY"),
      },
      {
        accessorFn: (row) => row,
        header: "Relation",
        enableSorting: false,
        cell: (info) => (
          <RelationsCell
            profile={info.getValue<SearchResult>()}
            lists={lists}
            refreshLists={refreshLists}
            listsLoading={refreshListsLoading}
            refreshSearch={refresh}
          />
        ),
      },
    ],
    [lists, refreshListsLoading]
  );

  const table = useReactTable<SearchResult>({
    data: results,
    columns,
    state: {
      sorting,
      pagination,
      rowSelection,
    },
    pageCount: Math.ceil(count / 100),
    onRowSelectionChange: setRowSelection,
    onSortingChange: setSorting,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getRowId: (row) => row.id.toString(),
  });

  const headers = table.getHeaderGroups().map((headerGroup) => (
    <tr key={headerGroup.id}>
      {headerGroup.headers.map((header) => {
        return header.id == "select" ? (
          <Center className={classes.control}>
            {flexRender(header.column.columnDef.header, header.getContext())}
          </Center>
        ) : (
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
      <tr
        key={row.id}
        className={row.getIsSelected() ? classes.rowSelected : undefined}
      >
        {row.getAllCells().map((cell) => {
          return (
            <td key={cell.id} style={{ paddingLeft: 10, paddingRight: 10 }}>
              {flexRender(cell.column.columnDef.cell, cell.getContext())}
            </td>
          );
        })}
      </tr>
    );
  });

  const selectedUsers = table
    .getSelectedRowModel()
    .rows.map(({ original }) => original);

  return (
    <Stack spacing={0} sx={{ flex: 1 }}>
      <Group position="apart" p="md" className={classes.headerGroup}>
        <Group>
          <Text size={14}>{selectedUsers.length} users selected</Text>
          <ActionMenu
            users={selectedUsers}
            target={
              <Button compact variant="default">
                <Group spacing="xs">
                  Actions
                  <IconChevronDown size={14} />
                </Group>
              </Button>
            }
            lists={lists}
            listsLoading={refreshListsLoading}
            refreshLists={refreshLists}
            refreshSearch={refresh}
          />
        </Group>
        <Group>
          <Text size={14}>
            Showing {Math.min(pageIndex * 100 + 1, count)} -{" "}
            {Math.min((pageIndex + 1) * 100, count)} of {count} results
          </Text>
          <Pagination
            size="sm"
            page={table.getState().pagination.pageIndex + 1}
            onChange={(page) => setPageIndex(page - 1)}
            total={table.getPageCount()}
          />
          <ActionIcon size="sm" color="blue" onClick={() => refresh(false)}>
            <IconRefresh />
          </ActionIcon>
        </Group>
      </Group>

      <div style={{ position: "relative" }}>
        <LoadingOverlay visible={loading} overlayBlur={2} />
        <ScrollArea
          sx={{
            height:
              "calc(100vh - var(--mantine-header-height, 0px) - var(--mantine-footer-height, 0px) - 54px)",
          }}
          onScrollPositionChange={({ y }) => setScrolled(y !== 0)}
        >
          <Table horizontalSpacing="md" verticalSpacing="xs" width="100%">
            <thead
              className={cx(classes.header, {
                [classes.scrolled]: scrolled,
              })}
              style={{ zIndex: 1 }}
            >
              {headers}
            </thead>
            <tbody>
              {rows.length > 0 ? (
                rows
              ) : !filtersSufficient ? (
                <tr>
                  <td colSpan={7}>
                    <Stack align="center" spacing="xs" mt={100}>
                      <Group spacing="xs">
                        <IconAlertCircle color="red" />
                        <Text weight="bold">Insufficient search filters</Text>
                      </Group>
                      <Text>
                        Select at least one required
                        <span style={{ color: "red" }}>*</span> filter from the
                        left panel
                      </Text>
                    </Stack>
                  </td>
                </tr>
              ) : (
                <tr>
                  <td colSpan={7}>
                    <Group spacing="xs" position="center" mt={100}>
                      <IconAlertCircle color="orange" />
                      <Text weight="bold">No users found</Text>
                    </Group>
                  </td>
                </tr>
              )}
            </tbody>
          </Table>
        </ScrollArea>
      </div>
    </Stack>
  );
};
