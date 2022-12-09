import { ActionIcon, DefaultMantineColor, Tooltip } from "@mantine/core";
import { Component } from "react";

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
        variant="default"
        color={color}
      >
        <Icon size={14} />
      </ActionIcon>
    </Tooltip>
  );
};
