import { CloseButton, Group, Paper, Text } from "@mantine/core";
import { useState } from "react";

export type FilterChipProps = {
  label: string;
  onClose?: () => Promise<void> | void;
  useLoader?: boolean;
};

export const Chip = ({
  label,
  onClose,
  useLoader = false,
}: FilterChipProps) => {
  const [loading, setLoading] = useState(false);

  return (
    <Paper
      shadow="md"
      withBorder
      radius="lg"
      px="xs"
      h={30}
      style={{ display: "flex" }}
      className="hover"
    >
      <Group position="apart" grow={false} noWrap spacing="xs">
        <Text>{label}</Text>
        {onClose && (
          <CloseButton
            size="xs"
            radius="lg"
            variant="outline"
            loading={useLoader ? loading : false}
            onClick={async () => {
              setLoading(true);
              try {
                await onClose();
              } catch (error) {
                console.error(error);
              }
              setLoading(false);
            }}
          />
        )}
      </Group>
    </Paper>
  );
};
