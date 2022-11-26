import { Button, Stack } from "@mantine/core";
import { DatePicker } from "@mantine/dates";
import { useState } from "react";

export type DateInputProps = {
  onSubmit: (arg: Date) => void;
  label: string;
};

export const DateInput = ({ label, onSubmit }: DateInputProps) => {
  const [date, setDate] = useState<Date>(new Date());

  return (
    <Stack>
      <DatePicker
        maxDate={new Date()}
        label={label}
        value={date}
        onChange={setDate}
      />
      <Button onClick={() => onSubmit(date)}>Add filter</Button>
    </Stack>
  );
};
