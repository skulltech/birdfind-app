import { Button, Checkbox, Group, Text, TextInput } from "@mantine/core";
import { useForm } from "@mantine/form";
import { closeAllModals, openModal } from "@mantine/modals";
import { showNotification } from "@mantine/notifications";
import axios from "axios";
import { useState } from "react";
import { List } from "../../utils/supabase";

export const openCreateListModal = () =>
  openModal({
    title: "Create a list",
    children: <CreateListForm />,
  });

const CreateListForm = () => {
  const [loading, setLoading] = useState(false);

  const form = useForm({
    initialValues: {
      name: "",
      description: "",
      private: false,
    },
  });

  const handleSubmit = async (values: typeof form.values) => {
    setLoading(true);

    let list: List;
    try {
      // Create list
      const response = await axios.get("/api/twips/create-list", {
        params: values,
      });
      list = response.data;
    } catch (error) {
      // Show error notification if something went wrong
      console.log(error);
    } finally {
      setLoading(false);
    }

    // Close modal and show success message
    closeAllModals();
    showNotification({
      title: "Success",
      message: (
        <Text>
          Created list <span style={{ fontWeight: "bold" }}>{list.name}</span>
        </Text>
      ),
      color: "green",
    });
    setLoading(false);
  };

  return (
    <form onSubmit={form.onSubmit(handleSubmit)}>
      <TextInput withAsterisk label="Name" {...form.getInputProps("name")} />
      <TextInput label="Description" {...form.getInputProps("description")} />
      <Checkbox
        mt="md"
        label="Private"
        {...form.getInputProps("private", { type: "checkbox" })}
      />
      <Group position="right" mt="md">
        <Button type="submit" loading={loading}>
          Create list
        </Button>
      </Group>
    </form>
  );
};
