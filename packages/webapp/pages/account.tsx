import { Anchor, Avatar, Button, Group, Stack, Text } from "@mantine/core";
import { IconBrandTwitter } from "@tabler/icons";
import Head from "next/head";
import { useRouter } from "next/router";
import { useUser } from "../providers/UserProvider";

const AccountSettings = () => {
  const router = useRouter();
  const { user } = useUser();

  return (
    <>
      <Head>
        <title>Account Settings | Birdfind</title>
      </Head>
      <Group align="flex-start">
        {user && (
          <Stack sx={{ flex: 1 }} align="center" p="md">
            <Avatar
              src={user.twitter?.profileImageUrl?.replace("_normal", "")}
              size="xl"
              variant="outline"
            />
            <Stack p="sm" spacing={0} align="center">
              {user.twitter && <Text>{user?.twitter.name}</Text>}
              <Text c="dimmed">{user.email}</Text>
              {user.twitter && (
                <Anchor
                  href={`https://twitter.com/${user?.twitter?.username}`}
                  target="_blank"
                >
                  @{user.twitter.username}
                </Anchor>
              )}
            </Stack>
            <Stack spacing="sm">
              {!user.twitter && (
                <Text weight="bold">
                  You have to connect to a Twitter account to use Birdfind.
                </Text>
              )}
              <Button
                onClick={() => router.push("/api/auth/twitter/signin")}
                leftIcon={<IconBrandTwitter />}
                variant={user.twitter ? "outline" : "filled"}
              >
                {user.twitter
                  ? "Connect to a different Twitter account"
                  : "Connect Twitter"}
              </Button>
            </Stack>
          </Stack>
        )}
      </Group>
    </>
  );
};

export default AccountSettings;
