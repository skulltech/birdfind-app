import { Button, Group, NumberInput, Stack, Text } from "@mantine/core";
import { useState } from "react";

interface NumberRangeInputProps {
  label: string;
  onSubmit: (arg: { minValue: number; maxValue: number }) => Promise<void>;
}

export const NumberRangeInput = ({
  label,
  onSubmit,
}: NumberRangeInputProps) => {
  const [minValue, setMinValue] = useState<number>(undefined);
  const [maxValue, setMaxValue] = useState<number>(undefined);
  const [loading, setLoading] = useState(false);

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
      <Button
        loading={loading}
        onClick={async () => {
          setLoading(true);
          try {
            await onSubmit({ minValue, maxValue });
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
