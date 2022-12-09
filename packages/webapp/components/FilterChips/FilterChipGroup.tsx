import { Stack } from "@mantine/core";
import { Filters } from "@twips/lib";
import dayjs from "dayjs";
import { useEffect, useState } from "react";
import { useTwips } from "../TwipsProvider";
import { FilterChip } from "./FilterChip";

type Chip = {
  label: string;
  filtersToRemove: Partial<Filters>;
};

type RenderRangeFilterArgs = {
  min: any;
  max: any;
  label: string;
};

const formatDate = (date: Date) => dayjs(date).format("DD/MM/YYYY");

const renderDateRangeFilter = ({ min, max, label }: RenderRangeFilterArgs) => {
  const [minName, minValue] = Object.entries(min)[0];
  const [maxName, maxValue] = Object.entries(max)[0];

  if (minValue || maxValue) {
    if (minValue && maxValue)
      return {
        label: `${label} on ${formatDate(minValue as Date)} to ${formatDate(
          maxValue as Date
        )}`,
        filtersToRemove: {
          [minName]: [minValue],
          [maxName]: [maxValue],
        },
      };
    else if (maxValue)
      return {
        label: `${label} before ${formatDate(maxValue as Date)}`,
        filtersToRemove: { [maxName]: [maxValue] },
      };
    else if (minValue)
      return {
        label: `${label} after ${formatDate(minValue as Date)}`,
        filtersToRemove: { [minName]: [minValue] },
      };
  }
};

const renderNumberRangeFilter = ({
  min,
  max,
  label,
}: RenderRangeFilterArgs) => {
  const [minName, minValue] = Object.entries(min)[0];
  const [maxName, maxValue] = Object.entries(max)[0];

  if (minValue || maxValue) {
    if (minValue && maxValue)
      return {
        label: `${label} ${minValue} to ${maxValue}`,
        filtersToRemove: {
          [minName]: [minValue],
          [maxName]: [maxValue],
        },
      };
    else if (maxValue)
      return {
        label: `${label} 0 to ${maxValue}`,
        filtersToRemove: { [maxName]: [maxValue] },
      };
    else if (minValue)
      return {
        label: `${label} ${minValue} to ∞`,
        filtersToRemove: { [minName]: [minValue] },
      };
  }
};

export const FilterChipGroup = (props) => {
  const { filters, removeFilters } = useTwips();
  const [chips, setChips] = useState<Chip[]>([]);

  useEffect(() => {
    const chips = [];

    const {
      followedBy,
      followerOf,
      followersCountGreaterThan,
      followersCountLessThan,
      followingCountGreaterThan,
      followingCountLessThan,
      tweetCountGreaterThan,
      tweetCountLessThan,
      createdAfter,
      createdBefore,
      mutedBy,
      blockedBy,
    } = filters;

    followedBy?.forEach((x) => {
      chips.push({
        label: `Followed by @${x}`,
        filtersToRemove: { followedBy: [x] },
      });
    });
    followerOf?.forEach((x) => {
      chips.push({
        label: `Follower of @${x}`,
        filtersToRemove: { followerOf: [x] },
      });
    });

    let chip;

    chip = renderNumberRangeFilter({
      min: { followersCountGreaterThan },
      max: { followersCountLessThan },
      label: "Followers count",
    });
    if (chip) chips.push(chip);

    chip = renderNumberRangeFilter({
      min: { followingCountGreaterThan },
      max: { followingCountLessThan },
      label: "Following count",
    });
    if (chip) chips.push(chip);

    chip = renderNumberRangeFilter({
      min: { tweetCountGreaterThan },
      max: { tweetCountLessThan },
      label: "Tweet count",
    });
    if (chip) chips.push(chip);

    chip = renderDateRangeFilter({
      min: { createdAfter },
      max: { createdBefore },
      label: "Account created",
    });
    if (chip) chips.push(chip);

    setChips(chips);

    if (mutedBy)
      chips.push({
        label: "Muted by you",
        filtersToRemove: { mutedBy },
      });

    if (blockedBy)
      chips.push({
        label: "Blocked by you",
        filtersToRemove: { blockedBy },
      });
  }, [filters]);

  return (
    <Stack {...props}>
      {chips.map(({ label, filtersToRemove }, index) => (
        <FilterChip
          key={index}
          label={label}
          onClose={() => removeFilters(filtersToRemove)}
        />
      ))}
    </Stack>
  );
};
