import { Button, Group, Select } from "@mantine/core";
import { useState } from "react";

const titleCase = (str: string) => str[0].toUpperCase() + str.slice(1);

type ActionFormProps = {
  userIds: BigInt[];
};

export const ActionForm = ({ userIds }: ActionFormProps) => {
  const [action, setAction] = useState<string | null>(null);

  const handleAction = async () => {
    console.log(userIds);
  };

  return (
    <Group>
      <Select
        label="Select action"
        placeholder="Pick one"
        data={[
          { value: "follow", label: "Follow" },
          { value: "unfollow", label: "Unfollow" },
          { value: "block", label: "Block" },
          { value: "mute", label: "Mute" },
        ]}
        value={action}
        onChange={setAction}
      />
      <Button
        onClick={handleAction}
        disabled={userIds.length == 0 || action == null}
      >
        {action ? titleCase(action) + " all" : "Perform action"}
      </Button>
    </Group>
  );
};
