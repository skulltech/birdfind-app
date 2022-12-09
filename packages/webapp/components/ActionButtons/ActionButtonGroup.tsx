import { ActionIcon, Button, Group, Select, Tooltip } from "@mantine/core";
import {
  IconCircleCheck,
  IconCircleOff,
  IconUserMinus,
  IconUserOff,
  IconUserPlus,
  IconVolume,
  IconVolumeOff,
} from "@tabler/icons";
import { useState } from "react";
import { ActionButton } from "./ActionButton";

const titleCase = (str: string) => str[0].toUpperCase() + str.slice(1);

type ActionFormProps = {
  userIds: BigInt[];
};

export const ActionButtonGroup = ({ userIds }: ActionFormProps) => {
  return (
    <Group>
      <ActionButton
        label="Follow"
        disabled={false}
        onClick={() => {}}
        Icon={IconUserPlus}
        color="green"
      />
      <ActionButton
        label="Unfollow"
        disabled={false}
        onClick={() => {}}
        Icon={IconUserMinus}
        color="red"
      />
      <ActionButton
        label="Block"
        disabled={false}
        onClick={() => {}}
        Icon={IconCircleOff}
        color="red"
      />
      <ActionButton
        label="Unblock"
        disabled={false}
        onClick={() => {}}
        Icon={IconCircleCheck}
        color="green"
      />
      <ActionButton
        label="Mute"
        disabled={false}
        onClick={() => {}}
        Icon={IconVolumeOff}
        color="red"
      />
      <ActionButton
        label="Unmute"
        disabled={false}
        onClick={() => {}}
        Icon={IconVolume}
        color="green"
      />
    </Group>
  );
};
