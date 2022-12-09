import { Group } from "@mantine/core";
import {
  IconCircleCheck,
  IconCircleOff,
  IconUserMinus,
  IconUserPlus,
  IconVolume,
  IconVolumeOff,
} from "@tabler/icons";
import { ActionButton } from "./ActionButton";

type ActionFormProps = {
  userIds: BigInt[];
};

export const ActionButtonGroup = ({ userIds }: ActionFormProps) => {
  const disabled = !Boolean(userIds.length);

  return (
    <Group>
      <ActionButton
        label="Follow"
        disabled={disabled}
        onClick={() => {}}
        Icon={IconUserPlus}
        color="green"
      />
      <ActionButton
        label="Unfollow"
        disabled={disabled}
        onClick={() => {}}
        Icon={IconUserMinus}
        color="red"
      />
      <ActionButton
        label="Block"
        disabled={disabled}
        onClick={() => {}}
        Icon={IconCircleOff}
        color="red"
      />
      <ActionButton
        label="Unblock"
        disabled={disabled}
        onClick={() => {}}
        Icon={IconCircleCheck}
        color="green"
      />
      <ActionButton
        label="Mute"
        disabled={disabled}
        onClick={() => {}}
        Icon={IconVolumeOff}
        color="red"
      />
      <ActionButton
        label="Unmute"
        disabled={disabled}
        onClick={() => {}}
        Icon={IconVolume}
        color="green"
      />
    </Group>
  );
};
