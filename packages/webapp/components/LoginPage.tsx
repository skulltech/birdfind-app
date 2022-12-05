import {
  Button,
  Container,
  Group,
  Paper,
  Stack,
  Text,
  TextInput,
} from "@mantine/core";
import { useSupabaseClient } from "@supabase/auth-helpers-react";
import { useForm } from "@mantine/form";
import { useState } from "react";
import { showNotification } from "@mantine/notifications";
import { IconCheck } from "@tabler/icons";
import { signIn } from "next-auth/react";

export const LoginPage = () => {
  const supabase = useSupabaseClient();
  const [loading, setLoading] = useState(false);

  const form = useForm({
    initialValues: {
      email: "",
    },
    validate: {
      email: (value) => (/^\S+@\S+$/.test(value) ? null : "Invalid email"),
    },
  });

  const handleLogin = async (email: string) => {
    setLoading(true);
    const { error } = await supabase.auth.signInWithOtp({ email });
    if (error) {
      console.log(error);
      showNotification({
        title: "Error",
        message:
          "There was an error while signing you in. Please contact the Twips team regarding this issue.",
        color: "red",
      });
    } else {
      showNotification({
        title: "Email sent with magic link!",
        message:
          "You'll shortly receive an email with a magic sign-in link. You can click that link to sign in to Twips.",
        color: "green",
        icon: <IconCheck />,
      });
    }
    setLoading(false);
  };

  return (
    <Container size="xs" p="xl">
      <Stack>
        <Text>
          Welcome to Twips! Please login with your email to use the app.
        </Text>
        <Paper>
          <form onSubmit={form.onSubmit((values) => handleLogin(values.email))}>
            <TextInput
              withAsterisk
              label="Email"
              placeholder="your@email.com"
              {...form.getInputProps("email")}
            />
            <Group position="right" mt="md">
              <Button type="submit" loading={loading}>
                Login
              </Button>
            </Group>
          </form>
        </Paper>
        <Button onClick={() => signIn()}>Login with Twitter</Button>
      </Stack>
    </Container>
  );
};
