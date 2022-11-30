import { Button, Group, Select, TextInput, NumberInput } from "@mantine/core";
import { DatePicker } from "@mantine/dates";
import { IconAt } from "@tabler/icons";
import { useEffect, useState } from "react";

export type FilterFormProps = {
  onSubmit: (arg0: string, arg1: Date | number | string) => void;
};

const numberFormatter = (arg: string | undefined) =>
  arg == undefined ? "" : arg.replace(/\B(?=(\d{3})+(?!\d))/g, ",");

export const FilterForm = ({ onSubmit }: FilterFormProps) => {
  const [filterName, setFilterName] = useState<string | null>(null);
  const [filterValue, setFilterValue] = useState<Date | number | string | null>(
    null
  );

  useEffect(() => {
    setFilterValue(null);
  }, [filterName]);

  return (
    <Group position="center">
      <Select
        placeholder="Select filter"
        searchable
        nothingFound="No options"
        value={filterName}
        onChange={setFilterName}
        data={[
          { value: "followedBy", label: "Followed by" },
          { value: "followerOf", label: "Follower of" },
          {
            value: "followersCountLessThan",
            label: "Followers count less than",
          },
          {
            value: "followersCountGreaterThan",
            label: "Followers count greater than",
          },
          {
            value: "followingCountLessThan",
            label: "Following count less than",
          },
          {
            value: "followingCountGreaterThan",
            label: "Following count greater than",
          },
          { value: "tweetCountLessThan", label: "Tweet count less than" },
          { value: "tweetCountGreaterThan", label: "Tweet count greater than" },
          { value: "createdBefore", label: "Account created before" },
          { value: "createdAfter", label: "Account created after" },
        ]}
      />
      {["followerOf", "followedBy"].includes(filterName) ? (
        <TextInput
          placeholder="Enter username"
          value={(filterValue as string) ?? ""}
          icon={<IconAt size={14} />}
          onChange={(event) => setFilterValue(event.currentTarget.value)}
        />
      ) : [
          "followersCountLessThan",
          "followersCountGreaterThan",
          "followingCountLessThan",
          "followingCountGreaterThan",
          "tweetCountLessThan",
          "tweetCountGreaterThan",
        ].includes(filterName) ? (
        <NumberInput
          placeholder="Enter number"
          value={filterValue as number}
          onChange={setFilterValue}
          min={0}
          step={10}
          stepHoldDelay={500}
          stepHoldInterval={(t) => Math.max(1000 / t ** 2, 25)}
          formatter={numberFormatter}
        />
      ) : ["createdBefore", "createdAfter"].includes(filterName) ? (
        <DatePicker
          placeholder="Select date"
          maxDate={new Date()}
          value={filterValue as Date}
          onChange={setFilterValue}
        />
      ) : null}
      <Button onClick={() => onSubmit(filterName, filterValue)}>
        Add filter
      </Button>
    </Group>
  );
};
