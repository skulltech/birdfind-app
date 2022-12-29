import { Button, Group, Menu, Modal, Progress } from "@mantine/core";
import { showNotification } from "@mantine/notifications";
import { IconChevronDown, IconSettings } from "@tabler/icons";
import axios from "axios";
import { useState } from "react";
import { Action } from "../../utils/helpers";

type ActionMenuProps = {
  userIds: BigInt[];
};

export const ActionMenu = ({ userIds }: ActionMenuProps) => {
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
      <Menu shadow="md" width={200}>
        <Menu.Target>
          <Button compact variant="default">
            <Group spacing="xs">
              Actions
              <IconChevronDown size={14} />
            </Group>
          </Button>
        </Menu.Target>

        <Menu.Dropdown>
          <Menu.Item
            icon={<IconSettings size={14} />}
            onClick={() => performAction("follow")}
          >
            Follow
          </Menu.Item>
          <Menu.Item
            icon={<IconSettings size={14} />}
            onClick={() => performAction("unfollow")}
          >
            Unfollow
          </Menu.Item>
          <Menu.Divider />

          <Menu.Item
            icon={<IconSettings size={14} />}
            onClick={() => performAction("block")}
          >
            Block
          </Menu.Item>
          <Menu.Item
            icon={<IconSettings size={14} />}
            onClick={() => performAction("unblock")}
          >
            Unblock
          </Menu.Item>
          <Menu.Divider />

          <Menu.Item
            icon={<IconSettings size={14} />}
            onClick={() => performAction("mute")}
          >
            Mute
          </Menu.Item>
          <Menu.Item
            icon={<IconSettings size={14} />}
            onClick={() => performAction("unmute")}
          >
            Unmute
          </Menu.Item>
          <Menu.Divider />

          <Menu.Item icon={<IconSettings size={14} />} onClick={() => {}}>
            Create list
          </Menu.Item>
        </Menu.Dropdown>
      </Menu>
    </>
  );
};
