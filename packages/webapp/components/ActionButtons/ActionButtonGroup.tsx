import { Divider, Group, Modal, Progress, Text } from "@mantine/core";
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

type ActionButtonGroupProps = {
  userIds: BigInt[];
};

export const ActionButtonGroup = ({ userIds }: ActionButtonGroupProps) => {
  const [progress, setProgress] = useState(0);
  const [loading, setLoading] = useState(false);

  const performAction = async (action: Action) => {
    setProgress(0);
    setLoading(true);

    for (const [index, userId] of userIds.entries()) {
      await axios.get("/api/twips/perform-action", {
        params: { userId, action },
      });
      // Set progress in loader bar
      setProgress(((index + 1) / userIds.length) * 100);
    }
    setLoading(false);
  };

  return (
    <>
      <Modal
        opened={loading}
        onClose={() => setLoading(false)}
        title="Performing action"
        withCloseButton={false}
        closeOnClickOutside={false}
        closeOnEscape={false}
      >
        <Text c="dimmed">Progress</Text>
        <Progress value={progress} />
      </Modal>

      {Boolean(userIds.length) && (
        <Group spacing="lg">
          <ActionButton
            label="Follow"
            onClick={() => performAction("follow")}
            Icon={IconUserPlus}
            color="default"
          />
          <ActionButton
            label="Unfollow"
            onClick={() => performAction("unfollow")}
            Icon={IconUserMinus}
            color="red"
          />
          <Divider orientation="vertical" />

          <ActionButton
            label="Block"
            onClick={() => performAction("block")}
            Icon={IconCircleOff}
            color="red"
          />
          <ActionButton
            label="Unblock"
            onClick={() => performAction("unblock")}
            Icon={IconCircleCheck}
            color="green"
          />
          <Divider orientation="vertical" />

          <ActionButton
            label="Mute"
            onClick={() => performAction("mute")}
            Icon={IconVolumeOff}
            color="red"
          />
          <ActionButton
            label="Unmute"
            onClick={() => performAction("unmute")}
            Icon={IconVolume}
            color="green"
          />
        </Group>
      )}
    </>
  );
};
