import { ActionIcon, DefaultMantineColor, Tooltip } from "@mantine/core";

type ActionButtonProps = {
  Icon: any;
  onClick: () => void;
  disabled: boolean;
  label: string;
  color: DefaultMantineColor;
};

export const ActionButton = ({
  Icon,
  onClick,
  disabled,
  label,
  color,
}: ActionButtonProps) => {
  return (
    <Tooltip label={label}>
      <ActionIcon
        onClick={onClick}
        disabled={disabled}
        variant="outline"
        color={color}
      >
        <Icon size={16} />
      </ActionIcon>
    </Tooltip>
  );
};
