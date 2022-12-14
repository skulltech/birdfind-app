import { Checkbox } from "@mantine/core";
import { useEffect, useState } from "react";
import { FilterInputProps } from "../../utils/helpers";
import { useTwips } from "../TwipsProvider";

interface CheckboxInputProps extends FilterInputProps {
  relation: "blocking" | "muting";
}

export const CheckboxInput = ({ label, relation }: CheckboxInputProps) => {
  const [checked, setChecked] = useState(false);
  const { filters, addFilters, removeFilters } = useTwips();

  const addFilter = () => {
    if (relation == "blocking") addFilters({ blockedByUser: true });
    else addFilters({ mutedByUser: true });
  };

  const removeFilter = () => {
    if (relation == "blocking") removeFilters({ blockedByUser: true });
    else removeFilters({ mutedByUser: true });
  };

  useEffect(() => {
    if (relation == "blocking") setChecked(filters.blockedByUser ?? false);
    else setChecked(filters.mutedByUser ?? false);
  }, [filters]);

  return (
    <Checkbox
      label={label}
      checked={checked}
      onChange={(event) =>
        event.currentTarget.checked ? addFilter() : removeFilter()
      }
    />
  );
};
