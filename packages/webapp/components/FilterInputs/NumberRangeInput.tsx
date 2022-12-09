import { ActionIcon, Group, NumberInput, Stack, Text } from "@mantine/core";
import { IconArrowNarrowRight } from "@tabler/icons";
import { useState } from "react";
import { FilterInputProps } from "../../utils/helpers";
import { useTwips } from "../TwipsProvider";

interface NumberRangeInputProps extends FilterInputProps {
  metric: "tweet" | "followers" | "following";
}

export const NumberRangeInput = ({ label, metric }: NumberRangeInputProps) => {
  const [minValue, setMinValue] = useState<number>(undefined);
  const [maxValue, setMaxValue] = useState<number>(undefined);
  const { addFilters } = useTwips();

  return (
    <Stack spacing="xs">
      <Text>{label}</Text>
      <Group spacing={8} noWrap position="center">
        <NumberInput
          value={minValue}
          onChange={setMinValue}
          min={0}
          max={maxValue}
          step={10}
          stepHoldDelay={500}
          stepHoldInterval={(t) => Math.max(1000 / t ** 2, 25)}
        />
        <Text align="center" span>
          to
        </Text>
        <NumberInput
          value={maxValue}
          onChange={setMaxValue}
          min={minValue}
          step={10}
          stepHoldDelay={500}
          stepHoldInterval={(t) => Math.max(1000 / t ** 2, 25)}
        />
        <ActionIcon
          size="lg"
          variant="default"
          onClick={() => {
            if (metric == "followers")
              addFilters({
                followersCountLessThan: maxValue,
                followersCountGreaterThan: minValue,
              });
            if (metric == "following")
              addFilters({
                followingCountLessThan: maxValue,
                followingCountGreaterThan: minValue,
              });
            if (metric == "tweet")
              addFilters({
                tweetCountLessThan: maxValue,
                tweetCountGreaterThan: minValue,
              });
          }}
        >
          <IconArrowNarrowRight size={16} />
        </ActionIcon>
      </Group>
    </Stack>
  );
};
