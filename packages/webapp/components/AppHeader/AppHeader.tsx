import {
  ActionIcon,
  createStyles,
  Group,
  Header,
  Text,
  Title,
  UnstyledButton,
  useMantineColorScheme,
} from "@mantine/core";
import { IconMoonStars, IconSun } from "@tabler/icons";
import { useRouter } from "next/router";
import { useTwipsUser } from "../../providers/TwipsUserProvider";
import { JobMenu } from "./JobMenu";
import { AccountMenu } from "./AccountMenu";
import { useEffect, useState } from "react";
import { Abril_Fatface } from "@next/font/google";
import Image from "next/image";

type AppHeaderProps = {
  [x: string]: any;
};

const abrilFatface = Abril_Fatface({ weight: "400", subsets: ["latin"] });

// Ref: https://ui.mantine.dev/component/double-header
const useStyles = createStyles((theme) => ({
  link: {
    color:
      theme.colorScheme === "dark"
        ? theme.colors.dark[1]
        : theme.colors.gray[7],
    height: 50,
    fontSize: 16,
    fontWeight: 600,
    transition: "border-color 100ms ease, color 100ms ease",
    borderBottom: "2px solid transparent",

    "&:hover": {
      color: theme.colorScheme === "dark" ? theme.white : theme.black,
      backgroundColor:
        theme.colorScheme === "dark"
          ? theme.colors.dark[6]
          : theme.colors.gray[0],
      // color: theme.colorScheme === "dark" ? theme.white : theme.black,
    },
  },

  linkActive: {
    "&, &:hover": {
      backgroundColor: theme.fn.variant({
        variant: "light",
        color: theme.primaryColor,
      }).background,
      color: theme.fn.variant({ variant: "light", color: theme.primaryColor })
        .color,
      borderBottomColor:
        theme.colors[theme.primaryColor][theme.colorScheme === "dark" ? 5 : 6],
    },
  },
}));

interface LinkProps {
  label: string;
  link: string;
}

const links: LinkProps[] = [
  {
    label: "Home",
    link: "/",
  },
  {
    label: "Search",
    link: "/search",
  },
];

export const AppHeader = ({ ...others }: AppHeaderProps) => {
  const router = useRouter();
  const { colorScheme, toggleColorScheme } = useMantineColorScheme();
  const { user } = useTwipsUser();
  const dark = colorScheme === "dark";

  const { classes, cx } = useStyles();

  // The current active tab// link
  const [active, setActive] = useState(null);
  useEffect(
    () =>
      setActive(
        links.filter((x) => x.link === router.pathname).map((x) => x.label)[0]
      ),
    [router.pathname]
  );

  return (
    <Header height={60} {...others}>
      <Group position="apart">
        <Group spacing={40} align="stretch">
          <UnstyledButton
            component="a"
            href="/"
            onClick={(event) => {
              event.preventDefault();
              router.push("/");
            }}
            sx={{ display: "flex", alignItems: "center" }}
          >
            <Group spacing="xs">
              <Image
                src="/images/icons8-twitter-64.png"
                alt="Twitter logo"
                width={34}
                height={34}
              />
              <Title order={2} className={abrilFatface.className}>
                Twips
              </Title>
            </Group>
          </UnstyledButton>
          {user && (
            <Group spacing="xs" align="center">
              {links.map((item) => (
                <UnstyledButton
                  component="a"
                  href={item.link}
                  key={item.label}
                  className={cx(classes.link, {
                    [classes.linkActive]: item.label == active,
                  })}
                  onClick={(event) => {
                    event.preventDefault();
                    router.push(item.link);
                    setActive(item.label);
                  }}
                  py={5}
                  px="lg"
                  sx={{ borderRadius: 3 }}
                >
                  <Text pt={6}>{item.label}</Text>
                </UnstyledButton>
              ))}
            </Group>
          )}
        </Group>

        <Group>
          {user && (
            <>
              <JobMenu />
              <AccountMenu />
            </>
          )}

          <ActionIcon
            variant="outline"
            color={dark ? "yellow" : "blue"}
            onClick={() => toggleColorScheme()}
            title="Toggle color scheme"
          >
            {dark ? <IconSun size={18} /> : <IconMoonStars size={18} />}
          </ActionIcon>
        </Group>
      </Group>
    </Header>
  );
};
