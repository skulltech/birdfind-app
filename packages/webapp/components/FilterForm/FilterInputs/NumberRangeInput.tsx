import {
  ActionIcon,
  Button,
  Group,
  NumberInput,
  Stack,
  Text,
} from "@mantine/core";
import { IconArrowNarrowRight } from "@tabler/icons";
import { useState } from "react";

interface NumberRangeInputProps {
  label: string;
  onSubmit: (arg: { minValue: number; maxValue: number }) => void;
}

export const NumberRangeInput = ({
  label,
  onSubmit,
}: NumberRangeInputProps) => {
  const [minValue, setMinValue] = useState<number>(undefined);
  const [maxValue, setMaxValue] = useState<number>(undefined);

  return (
    <Stack spacing="sm">
      <Text size="sm">{label}</Text>
      <Group spacing={6} noWrap position="center">
        <NumberInput
          value={minValue}
          onChange={setMinValue}
          min={0}
          max={maxValue}
          hideControls
        />
        <Text align="center" span>
          to
        </Text>
        <NumberInput
          hideControls
          value={maxValue}
          onChange={setMaxValue}
          min={minValue}
        />
      </Group>
      <Button onClick={() => onSubmit({ minValue, maxValue })}>
        Add filter
      </Button>
    </Stack>
  );
};
