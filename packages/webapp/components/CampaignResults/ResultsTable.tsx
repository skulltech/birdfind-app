import {
  Group,
  Loader,
  Pagination,
  ScrollArea,
  Select,
  SelectItem,
  Table,
  Text,
} from "@mantine/core";
import { Dispatch, SetStateAction } from "react";

type ResultsTableProps = {
  rows: any[];
  sortItems: SelectItem[];
  sort: string;
  setSort: Dispatch<SetStateAction<string>>;
  count: number;
  pageIndex: number;
  setPageIndex: (pageIndex: number) => void;
  loading: boolean;
};

export const ResultsTable = ({
  rows,
  sortItems,
  sort,
  setSort,
  count,
  pageIndex,
  setPageIndex,
  loading,
}: ResultsTableProps) => {
  return (
    <>
      <Group position="apart">
        <Group spacing={6}>
          <Text weight="bold" size="sm">
            Sort by
          </Text>
          <Select
            // @ts-ignore
            onChange={setSort}
            data={sortItems}
            value={sort}
            size="sm"
            radius="xl"
            styles={{
              input: {
                lineHeight: "28px",
                minHeight: "30px",
                height: "30px",
              },
            }}
          />
        </Group>
        {loading && <Loader variant="dots" />}
        <Group>
          <Text size={14}>
            Showing {Math.min(pageIndex * 100 + 1, count)} -{" "}
            {Math.min((pageIndex + 1) * 100, count)} of{" "}
            <span style={{ fontWeight: "bold", fontSize: "1.2rem" }}>
              {count}
            </span>{" "}
            results
          </Text>
          <Pagination
            size="sm"
            page={pageIndex + 1}
            onChange={(page) => setPageIndex(page - 1)}
            total={Math.ceil(count / 100)}
          />
        </Group>
      </Group>
      <ScrollArea>
        <Table verticalSpacing="md" highlightOnHover>
          <tbody>
            {rows.map((Row, index) => (
              <Row key={index} />
            ))}
          </tbody>
        </Table>
      </ScrollArea>
    </>
  );
};
