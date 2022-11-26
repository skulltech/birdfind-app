import { Button, Group, NumberInput, Stack, Text } from "@mantine/core";
import { useState } from "react";

export type NumberRangeInputProps = {
  title: string;
  maxValue: number;
  initialMinValue: number;
  initialMaxValue: number;
  onSubmit: (arg: [number | undefined | number | undefined]) => void;
};

const numberFormatter = (arg: string | number | undefined) => {
  if (arg == undefined) return "";
  const stringArg = typeof arg == "number" ? arg.toString() : arg;
  return stringArg.replace(/\B(?=(\d{3})+(?!\d))/g, ",");
};

export const NumberRangeInput = ({
  title,
  maxValue,
  initialMinValue,
  initialMaxValue,
  onSubmit,
}) => {
  const [range, setRange] = useState<[number, number]>([
    initialMinValue,
    initialMaxValue,
  ]);

  return (
    <Stack spacing="xs">
      <Text>{title}</Text>
      <Group>
        <NumberInput
          label="Greater than"
          value={range[0]}
          onChange={(x) => setRange([x, range[1]])}
          min={0}
          max={range[1]}
          step={10}
          stepHoldDelay={500}
          stepHoldInterval={(t) => Math.max(1000 / t ** 2, 25)}
          formatter={numberFormatter}
        />
        <NumberInput
          label="Less than"
          value={range[1]}
          onChange={(x) => setRange([range[0], x])}
          min={range[0]}
          max={maxValue}
          step={10}
          stepHoldDelay={500}
          stepHoldInterval={(t) => Math.max(1000 / t ** 2, 25)}
          formatter={numberFormatter}
        />
      </Group>
      <Button onClick={() => onSubmit(range)}>Add filter</Button>
    </Stack>
  );
};
