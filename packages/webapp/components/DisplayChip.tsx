import { CloseButton, Group, Paper, Text } from "@mantine/core";
import { useState } from "react";

export type DisplayChipProps = {
  label: string;
  onClose?: () => Promise<void> | void;
  useLoader?: boolean;
};

export const DisplayChip = ({
  label,
  onClose,
  useLoader = false,
}: DisplayChipProps) => {
  const [loading, setLoading] = useState(false);

  return (
    <Paper
      shadow="md"
      withBorder
      radius="lg"
      px="xs"
      h={30}
      style={{ display: "flex" }}
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
