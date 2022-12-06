import {
  Button,
  Container,
  Divider,
  Group,
  Paper,
  Stack,
  Text,
  TextInput,
} from "@mantine/core";
import { useForm } from "@mantine/form";
import { showNotification } from "@mantine/notifications";
import { useSupabaseClient } from "@supabase/auth-helpers-react";
import { IconBrandGoogle, IconCheck } from "@tabler/icons";
import { useState } from "react";

const SignIn = () => {
  const [loading, setLoading] = useState(false);
  const supabase = useSupabaseClient();

  const form = useForm({
    initialValues: {
      email: "",
    },
    validate: {
      email: (value) => (/^\S+@\S+$/.test(value) ? null : "Invalid email"),
    },
  });

  const handleEmailSignIn = async (email: string) => {
    setLoading(true);

    // Call signInWithOtp
    const { error } = await supabase.auth.signInWithOtp({ email: email });

    // Show notification depending on success
    if (error)
      showNotification({
        title: "Error",
        message: error.message,
        color: "red",
        icon: <IconCheck />,
        autoClose: false,
      });
    else
      showNotification({
        title: "Email sent with magic link!",
        message:
          "You'll shortly receive an email with a magic sign-in link. You can click that link to sign in to Twips.",
        color: "green",
        icon: <IconCheck />,
        autoClose: false,
      });

    setLoading(false);
  };

  return (
    <Container size="xs" p="xl" mt={100}>
      <Paper radius="md" p="xl" withBorder>
        <Text size="lg" weight={500}>
          Welcome to Twips, login with
        </Text>
        <Group grow mb="md" mt="md">
          <Button
            radius="xl"
            leftIcon={<IconBrandGoogle />}
            onClick={() =>
              supabase.auth.signInWithOAuth({
                provider: "google",
                options: {
                  redirectTo: "/",
                },
              })
            }
          >
            Google
          </Button>
        </Group>
        <Divider
          label="Or continue with email"
          labelPosition="center"
          my="lg"
        />
        <form
          onSubmit={form.onSubmit(() => handleEmailSignIn(form.values.email))}
        >
          <Stack mt="md">
            <TextInput
              required
              label="Email"
              placeholder="your@email.com"
              {...form.getInputProps("email")}
            />
          </Stack>
          <Group position="apart" mt="xl">
            <Button type="submit" loading={loading}>
              Login
            </Button>
          </Group>
        </form>
      </Paper>
    </Container>
  );
};

export default SignIn;
