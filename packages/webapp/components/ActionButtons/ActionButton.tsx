import { ActionIcon, DefaultMantineColor, Tooltip } from "@mantine/core";

type ActionButtonProps = {
  Icon: any;
  onClick: () => void;
  label: string;
  color?: DefaultMantineColor;
};

export const ActionButton = ({
  Icon,
  onClick,
  label,
  color,
}: ActionButtonProps) => {
  return (
    <Tooltip label={label}>
      <ActionIcon
        onClick={onClick}
        variant="subtle"
        color={color}
        size="md"
        radius="lg"
      >
        <Icon size={16} />
      </ActionIcon>
    </Tooltip>
  );
};
