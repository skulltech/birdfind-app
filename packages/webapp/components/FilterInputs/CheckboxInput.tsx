import { Checkbox } from "@mantine/core";
import { useEffect, useState } from "react";
import { FilterInputProps } from "../../utils/helpers";
import { useTwips } from "../TwipsProvider";

interface CheckboxInputProps extends FilterInputProps {
  action: "block" | "mute";
}

export const CheckboxInput = ({ label, action }: CheckboxInputProps) => {
  const [checked, setChecked] = useState(false);
  const { user, addFilters } = useTwips();

  useEffect(() => {
    if (action == "block")
      addFilters({ blockedBy: checked ? user.twitter.username : null });
    else addFilters({ mutedBy: checked ? user.twitter.username : null });
  }, [checked]);

  return (
    <Checkbox
      label={label}
      checked={checked}
      onChange={(event) => setChecked(event.currentTarget.checked)}
    />
  );
};
