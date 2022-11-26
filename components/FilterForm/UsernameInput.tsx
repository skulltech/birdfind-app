import { TextInput } from "@mantine/core";
import { useState } from "react";
import { IconAt } from "@tabler/icons";
import { getHotkeyHandler } from "@mantine/hooks";

export type UsernameInputProps = {
  label: string;
  onSubmit: (arg: string) => void;
};

export const UsernameInput = ({ label, onSubmit }: UsernameInputProps) => {
  const [username, setUsername] = useState("");

  return (
    <TextInput
      label={label}
      value={username}
      icon={<IconAt size={14} />}
      onChange={(event) => setUsername(event.currentTarget.value)}
      onKeyDown={getHotkeyHandler([
        [
          "Enter",
          () => {
            onSubmit(username);
            setUsername("");
          },
        ],
      ])}
    />
  );
};
