import {
  Anchor,
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
import { upperFirst, useToggle } from "@mantine/hooks";
import { showNotification } from "@mantine/notifications";
import { IconBrandGoogle, IconBrandTwitter, IconCheck } from "@tabler/icons";
import { signIn } from "next-auth/react";
import { useState } from "react";

const SignIn = () => {
  const [type, toggle] = useToggle(["login", "register"] as const);
  const [loading, setLoading] = useState(false);

  const form = useForm({
    initialValues: {
      email: "",
    },
    validate: {
      email: (value) => (/^\S+@\S+$/.test(value) ? null : "Invalid email"),
    },
  });

  const handleSubmit = async (values: typeof form.values) => {
    setLoading(true);

    // Call signIn
    const { error, ok } = await signIn("email", {
      email: values.email,
      redirect: false,
      callbackUrl: "/",
    });

    // Show notification depending on success
    if (ok)
      showNotification({
        title: "Email sent with magic link!",
        message:
          "You'll shortly receive an email with a magic sign-in link. You can click that link to sign in to Twips.",
        color: "green",
        icon: <IconCheck />,
        autoClose: false,
      });
    else
      showNotification({
        title: "Error",
        message: error,
        color: "red",
        icon: <IconCheck />,
        autoClose: false,
      });

    setLoading(false);
  };

  return (
    <Container size="xs" p="xl" mt={100}>
      <Paper radius="md" p="xl" withBorder>
        <Text size="lg" weight={500}>
          Welcome to Twips, {type} with
        </Text>
        {type === "login" && (
          <Group grow mb="md" mt="md">
            <Button
              radius="xl"
              leftIcon={<IconBrandTwitter />}
              onClick={() => signIn("twitter", { callbackUrl: "/" })}
            >
              Twitter
            </Button>
          </Group>
        )}
        <Group grow mb="md" mt="md">
          <Button
            radius="xl"
            leftIcon={<IconBrandGoogle />}
            onClick={() => signIn("google", { callbackUrl: "/" })}
          >
            Google
          </Button>
        </Group>
        <Divider
          label="Or continue with email"
          labelPosition="center"
          my="lg"
        />
        <form onSubmit={form.onSubmit(() => {})}>
          <Stack mt="md">
            <TextInput
              required
              label="Email"
              placeholder="your@email.com"
              {...form.getInputProps("email")}
            />
          </Stack>

          <Group position="apart" mt="xl">
            <Anchor
              component="button"
              type="button"
              color="dark"
              onClick={() => toggle()}
              size="sm"
            >
              {type === "register"
                ? "Already have an account? Login"
                : "Don't have an account? Register"}
            </Anchor>
            <Button
              type="submit"
              onClick={() => handleSubmit(form.values)}
              loading={loading}
            >
              {upperFirst(type)}
            </Button>
          </Group>
        </form>
      </Paper>
    </Container>
  );
};

export default SignIn;
