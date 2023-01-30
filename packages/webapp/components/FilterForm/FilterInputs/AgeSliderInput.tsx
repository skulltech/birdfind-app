import { Button, RangeSlider, Stack, Text } from "@mantine/core";
import dayjs from "dayjs";
import RelativeTime from "dayjs/plugin/relativeTime";
import { useState } from "react";

dayjs.extend(RelativeTime);

interface RangeSliderInputProps {
  label: string;
  onSubmit: (arg: { minDate: Date; maxDate: Date }) => Promise<void>;
}

export const AgeSliderInput = ({ label, onSubmit }: RangeSliderInputProps) => {
  const [rangeValue, setRangeValue] = useState<[number, number]>([20, 80]);
  const [loading, setLoading] = useState(false);

  const valueToDate = (value: number) => {
    const today = Date.now();
    const twitterLaunchDate = dayjs("Tuesday, March 21, 2006")
      .toDate()
      .getTime();
    return new Date(today - (value / 100) * (today - twitterLaunchDate));
  };

  const valueToAge = (value: number) => {
    const date = valueToDate(value);
    return dayjs().from(date, true);
  };

  return (
    <Stack spacing="sm">
      <Text>{label}</Text>
      <RangeSlider
        mt="xl"
        label={valueToAge}
        value={rangeValue}
        onChange={setRangeValue}
        labelAlwaysOn
      />
      <Button
        loading={loading}
        onClick={async () => {
          setLoading(true);
          try {
            await onSubmit({
              minDate: valueToDate(rangeValue[1]),
              maxDate: valueToDate(rangeValue[0]),
            });
          } catch (error) {
            console.error(error);
          }
          setLoading(false);
        }}
      >
        Add filter
      </Button>
    </Stack>
  );
};
