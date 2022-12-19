import { Button, Container, Paper, Stack, Text } from "@mantine/core";
import { useSupabaseClient } from "@supabase/auth-helpers-react";
import { IconBrandTwitter } from "@tabler/icons";
import { useRouter } from "next/router";
import { useEffect, useState } from "react";
import { getUserDetails, UserDetails } from "../../utils/supabase";

const TwitterAuth = () => {
  const router = useRouter();
  const supabase = useSupabaseClient();
  const [user, setUser] = useState<UserDetails>(null);
  const [loading, setLoading] = useState(false);

  // Load user details
  useEffect(() => {
    const loadUserDetails = async () => {
      setUser(await getUserDetails(supabase));
    };
    loadUserDetails();
  }, [supabase]);

  return (
    <Container size="xs" p="xl" mt={100}>
      <Paper withBorder p="lg">
        <Stack>
          <Text>You have to connect to a Twitter account to use Twips.</Text>
          {user?.twitter && (
            <Text>Currently connected to @{user?.twitter?.username}</Text>
          )}
          <Button
            onClick={() => {
              setLoading(true);
              router.push("/api/auth/twitter/signin");
            }}
            leftIcon={<IconBrandTwitter />}
            loading={loading}
          >
            {user?.twitter
              ? "Connect to a different Twitter account"
              : "Connect Twitter"}
          </Button>
        </Stack>
      </Paper>
    </Container>
  );
};

export default TwitterAuth;
