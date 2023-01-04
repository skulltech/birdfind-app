import { ActionIcon, Group, NumberInput, Stack, Text } from "@mantine/core";
import { IconArrowNarrowRight } from "@tabler/icons";
import { useState } from "react";
import { FilterInputProps } from "../../../utils/helpers";

interface NumberRangeInputProps extends FilterInputProps {
  metric: "tweet" | "followers" | "following";
}

export const NumberRangeInput = ({
  label,
  metric,
  addFilters,
}: NumberRangeInputProps) => {
  const [minValue, setMinValue] = useState<number>(undefined);
  const [maxValue, setMaxValue] = useState<number>(undefined);

  return (
    <Stack spacing={2}>
      <Text>{label}</Text>
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
        <ActionIcon
          size="lg"
          variant="default"
          onClick={() => {
            addFilters(
              metric == "followers"
                ? {
                    followersCountLessThan: maxValue,
                    followersCountGreaterThan: minValue,
                  }
                : metric == "following"
                ? {
                    followingCountLessThan: maxValue,
                    followingCountGreaterThan: minValue,
                  }
                : metric == "tweet"
                ? {
                    tweetCountLessThan: maxValue,
                    tweetCountGreaterThan: minValue,
                  }
                : null
            );
          }}
        >
          <IconArrowNarrowRight size={16} />
        </ActionIcon>
      </Group>
    </Stack>
  );
};
