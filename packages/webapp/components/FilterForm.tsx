import { Button, Group, Select, TextInput, NumberInput } from "@mantine/core";
import { DatePicker } from "@mantine/dates";
import { showNotification } from "@mantine/notifications";
import { IconAt } from "@tabler/icons";
import { TwitterUser } from "@twips/lib";
import { useEffect, useState } from "react";
import {
  dateFilters,
  numberFilters,
  usernameFilters,
} from "../utils/components";
import { lookupUser, updateUser } from "../utils/twips-api";

export type FilterFormProps = {
  onSubmit: (arg0: string, arg1: Date | number | string) => void;
};

// 24 hours
const staleCacheTimeout = 24 * 60 * 60 * 1000;

const numberFormatter = (arg: string | undefined) =>
  arg == undefined ? "" : arg.replace(/\B(?=(\d{3})+(?!\d))/g, ",");

export const FilterForm = ({ onSubmit }: FilterFormProps) => {
  const [filterName, setFilterName] = useState<string | null>(null);
  const [filterValue, setFilterValue] = useState<Date | number | string | null>(
    null
  );
  const [isFilterValid, setIsFilterValid] = useState(false);
  const [addFilterLoading, setAddFilterLoading] = useState(false);

  useEffect(() => {
    setFilterValue(undefined);
  }, [filterName]);

  useEffect(() => {
    // For all fields
    if (filterValue === null || filterValue === undefined) {
      setIsFilterValid(false);
      return;
    }

    // For username fields
    if (usernameFilters.includes(filterName)) {
      const username = filterValue as string;
      const lowercaseUsername = username.toLowerCase();
      if (
        /^([a-zA-Z0-9_]){4,15}$/.test(username) &&
        !lowercaseUsername.includes("admin") &&
        !lowercaseUsername.includes("twitter")
      )
        setIsFilterValid(true);
      else setIsFilterValid(false);
      return;
    }

    setIsFilterValid(true);
  }, [filterValue, filterName]);

  const handleSubmit = async () => {
    // For username fields we need to lookup user before adding
    if (usernameFilters.includes(filterName)) {
      setAddFilterLoading(true);

      // Lookup user
      let user: TwitterUser | null;
      try {
        const username = filterValue as string;
        user = await lookupUser(username);
      } catch (error) {
        console.log(error);
        return;
      }

      setAddFilterLoading(false);

      if (!user) {
        showNotification({
          title: "Error",
          message: "User doesn't exist",
          color: "red",
        });
        return;
      }

      const networkUpdatedAt =
        user[
          filterName === "followerOf"
            ? "followersUpdatedAt"
            : "followingUpdatedAt"
        ];
      const networkDirection =
        filterName === "followerOf" ? "followers" : "following";

      if (networkUpdatedAt.getTime() === 0) {
        try {
          await updateUser(user.id, networkDirection);
          showNotification({
            title: "Sorry",
            message: `We don't have @${filterValue}'s ${networkDirection} fetched in our database yet. A job has been scheduled to do so. Please check again in some time.`,
            color: "red",
          });
        } catch (error) {
          console.log(error);
        }
        return;
      }

      if (Date.now() - networkUpdatedAt.getTime() > staleCacheTimeout) {
        try {
          showNotification({
            title: "Warning",
            message: `@${filterValue}'s ${networkDirection} might be stale. A job has been scheduled to update it.`,
            color: "yellow",
          });
        } catch (error) {
          console.log(error);
        }
      }

      setAddFilterLoading(false);
    }

    // For all fields
    onSubmit(filterName, filterValue);
  };

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
      {usernameFilters.includes(filterName) ? (
        <TextInput
          placeholder="Enter username"
          value={(filterValue as string) ?? ""}
          icon={<IconAt size={14} />}
          onChange={(event) => setFilterValue(event.currentTarget.value)}
          error={!isFilterValid}
        />
      ) : numberFilters.includes(filterName) ? (
        <NumberInput
          placeholder="Enter number"
          value={filterValue as number}
          onChange={setFilterValue}
          min={0}
          step={10}
          stepHoldDelay={500}
          stepHoldInterval={(t) => Math.max(1000 / t ** 2, 25)}
          formatter={numberFormatter}
          error={!isFilterValid}
        />
      ) : dateFilters.includes(filterName) ? (
        <DatePicker
          placeholder="Select date"
          maxDate={new Date()}
          value={filterValue as Date}
          onChange={setFilterValue}
          error={!isFilterValid}
        />
      ) : null}
      <Button
        onClick={handleSubmit}
        disabled={!isFilterValid}
        loading={addFilterLoading}
      >
        Add filter
      </Button>
    </Group>
  );
};
