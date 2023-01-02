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
  Badge,
  Button,
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
  IconChevronDown,
  IconRefresh,
  IconSortAscending,
  IconSortDescending,
} from "@tabler/icons";
import { TwitterProfile } from "../../utils/helpers";
import { useTwipsSearch } from "../../providers/TwipsSearchProvider";
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
  const { results: users, refresh } = useTwipsSearch();

  const supabase = useSupabaseClient();
  const [lists, setLists] = useState<any[]>(null);
  const [refreshListsLoading, setRefreshListsLoading] = useState(false);

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
            checked={table.getIsAllRowsSelected()}
            onChange={table.getToggleAllRowsSelectedHandler()}
            transitionDuration={0}
            indeterminate={table.getIsSomeRowsSelected()}
          />
        ),
        cell: ({ row }) => (
          <Checkbox
            size="sm"
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
          />
        ),
        size: 170,
      },
    ],
    [lists, refreshListsLoading]
  );

  const table = useReactTable<SearchResult>({
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
            users={users.filter((x, i) => rowSelection[i])}
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
