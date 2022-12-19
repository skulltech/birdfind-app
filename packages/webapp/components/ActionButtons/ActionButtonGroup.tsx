import { Divider, Group, Modal, Progress, Text } from "@mantine/core";
import { showNotification } from "@mantine/notifications";
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
  const [label, setLabel] = useState("null");

  const performAction = async (action: Action) => {
    setProgress(0);
    setLoading(true);

    const labels: Record<Action, string> = {
      follow: "Following",
      unfollow: "Unfollowing",
      block: "Blocking",
      unblock: "Unblocking",
      mute: "Muting",
      unmute: "Unmuting",
    };
    setLabel(labels[action]);

    for (const [index, userId] of userIds.entries()) {
      const res = await axios.get("/api/twips/perform-action", {
        params: { userId, action },
      });
      if (res.status != 200) {
        showNotification({
          title: "Error",
          message:
            "Some error ocurred. You may have been rate limited. Please try again later.",
          color: "red",
        });
        break;
      }
      // Set progress in loader bar
      else setProgress(((index + 1) / userIds.length) * 100);
    }
    setLoading(false);
  };

  return (
    <>
      <Modal
        opened={loading}
        onClose={() => setLoading(false)}
        title={`${label} ${userIds.length} users`}
        withCloseButton={false}
        closeOnClickOutside={false}
        closeOnEscape={false}
      >
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
