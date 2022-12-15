import { Group } from "@mantine/core";
import {
  IconCircleCheck,
  IconCircleOff,
  IconUserMinus,
  IconUserPlus,
  IconVolume,
  IconVolumeOff,
} from "@tabler/icons";
import axios from "axios";
import { useState } from "react";
import { Action } from "../../utils/helpers";
import { ActionButton } from "./ActionButton";

type ActionFormProps = {
  userIds: BigInt[];
};

export const ActionButtonGroup = ({ userIds }: ActionFormProps) => {
  const disabled = !Boolean(userIds.length);
  const [loading, setLoading] = useState(false);

  const performAction = async (action: Action) => {
    setLoading(true);

    for (const userId of userIds) {
      await axios.get("/api/twips/perform-action", {
        params: { userId, action },
      });
    }

    setLoading(false);
  };

  return (
    <Group>
      <ActionButton
        label="Follow"
        disabled={disabled}
        onClick={() => performAction("follow")}
        Icon={IconUserPlus}
        color="green"
      />
      <ActionButton
        label="Unfollow"
        disabled={disabled}
        onClick={() => performAction("unfollow")}
        Icon={IconUserMinus}
        color="red"
      />
      <ActionButton
        label="Block"
        disabled={disabled}
        onClick={() => performAction("block")}
        Icon={IconCircleOff}
        color="red"
      />
      <ActionButton
        label="Unblock"
        disabled={disabled}
        onClick={() => performAction("unblock")}
        Icon={IconCircleCheck}
        color="green"
      />
      <ActionButton
        label="Mute"
        disabled={disabled}
        onClick={() => performAction("mute")}
        Icon={IconVolumeOff}
        color="red"
      />
      <ActionButton
        label="Unmute"
        disabled={disabled}
        onClick={() => performAction("unmute")}
        Icon={IconVolume}
        color="green"
      />
    </Group>
  );
};
