import { ActionIcon, Group, Stack, Text } from "@mantine/core";
import { DatePicker } from "@mantine/dates";
import { IconArrowNarrowRight } from "@tabler/icons";
import { useState } from "react";
import { FilterInputProps } from "../../utils/helpers";
import { useTwips } from "../TwipsProvider";

interface DateRangeInputProps extends FilterInputProps {}

const max = (arg1: Date, arg2?: Date) => {
  if (arg2 && arg2.getTime() < arg1.getTime()) return arg2;
  return arg1;
};

export const DateRangeInput = ({ label }: DateRangeInputProps) => {
  const [minDate, setMinDate] = useState<Date>(undefined);
  const [maxDate, setMaxDate] = useState<Date>(undefined);
  const { addFilters } = useTwips();

  return (
    <Stack spacing="xs">
      <Text>{label}</Text>
      <Group noWrap spacing="xs">
        <DatePicker
          maxDate={max(new Date(), maxDate)}
          value={minDate}
          onChange={setMinDate}
          inputFormat="DD/MM/YYYY"
        />
        <Text align="center">to</Text>
        <DatePicker
          minDate={minDate}
          maxDate={new Date()}
          value={maxDate}
          onChange={setMaxDate}
          inputFormat="DD/MM/YYYY"
        />
        <ActionIcon
          variant="default"
          onClick={() =>
            addFilters({ createdBefore: maxDate, createdAfter: minDate })
          }
        >
          <IconArrowNarrowRight />
        </ActionIcon>
      </Group>
    </Stack>
  );
};
