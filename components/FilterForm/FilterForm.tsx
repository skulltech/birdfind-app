import { Divider, Stack } from "@mantine/core";
import { Dispatch, SetStateAction } from "react";
import { Filters } from "../../lib/utils/helpers";
import { NumberRangeInput } from "./NumberRangeInput";
import { DateInput } from "./DateInput";
import { UsernameInput } from "./UsernameInput";

export type FilterFormProps = {
  filters: Filters;
  setFilters: Dispatch<SetStateAction<Filters>>;
};

export const FilterForm = ({ filters, setFilters }: FilterFormProps) => {
  const handleAppend = (filterName: string, input: string) => {
    if (input.length) {
      setFilters({
        ...filters,
        [filterName]: [...(filters[filterName] ?? []), input],
      });
    }
  };

  const handleSet = (newFilters: SetStateAction<Filters>) => {
    for (const [key, value] of Object.entries(newFilters)) {
      if (value == undefined) delete newFilters[key];
    }
    setFilters({ ...filters, ...newFilters });
  };

  return (
    <Stack>
      <Divider
        label="Follow network"
        labelProps={{ size: "md" }}
        labelPosition="left"
      />
      <UsernameInput
        label="Followed by"
        onSubmit={(value) => handleAppend("followedBy", value)}
      />
      <UsernameInput
        label="Follower of"
        onSubmit={(value) => handleAppend("followerOf", value)}
      />
      <Divider
        label="Followers count"
        labelProps={{ size: "md" }}
        labelPosition="left"
      />
      <NumberRangeInput
        maxValue={1000}
        initialMinValue={10}
        initialMaxValue={100}
        onSubmit={([rangeStart, rangeEnd]) => {
          handleSet({
            followersCountGreaterThan: rangeStart,
            followersCountLessThan: rangeEnd,
          });
        }}
      />
      <Divider
        label="Following count"
        labelProps={{ size: "md" }}
        labelPosition="left"
      />
      <NumberRangeInput
        maxValue={1000}
        initialMinValue={10}
        initialMaxValue={100}
        onSubmit={([rangeStart, rangeEnd]) => {
          handleSet({
            followingCountGreaterThan: rangeStart,
            followingCountLessThan: rangeEnd,
          });
        }}
      />
      <Divider
        label="Tweet count"
        labelProps={{ size: "md" }}
        labelPosition="left"
      />
      <NumberRangeInput
        maxValue={1000}
        initialMinValue={10}
        initialMaxValue={100}
        onSubmit={([rangeStart, rangeEnd]) => {
          handleSet({
            tweetCountGreaterThan: rangeStart,
            tweetCountLessThan: rangeEnd,
          });
        }}
      />
      <Divider
        label="Account creation date"
        labelProps={{ size: "md" }}
        labelPosition="left"
      />
      <DateInput
        label="Created before"
        onSubmit={(date: Date) => {
          handleSet({ createdBefore: date });
        }}
      />
      <DateInput
        label="Created after"
        onSubmit={(date: Date) => {
          handleSet({ createdAfter: date });
        }}
      />
    </Stack>
  );
};
