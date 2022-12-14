import { Checkbox, Loader } from "@mantine/core";
import { useEffect, useState } from "react";
import { FilterInputProps } from "../../utils/helpers";
import { updateTwips } from "../../utils/twips";
import { useTwips } from "../TwipsProvider";

interface CheckboxInputProps extends FilterInputProps {
  relation: "blocking" | "muting";
}

export const CheckboxInput = ({ label, relation }: CheckboxInputProps) => {
  const [checked, setChecked] = useState(false);
  const { addFilters } = useTwips();

  // add and remove filter on check and uncheck
  useEffect(() => {
    if (relation == "blocking") addFilters({ blockedByUser: checked });
    else addFilters({ mutedByUser: checked });
  }, [checked]);

  return (
    <Checkbox
      label={label}
      checked={checked}
      onChange={(event) => setChecked(event.currentTarget.checked)}
    />
  );
};
