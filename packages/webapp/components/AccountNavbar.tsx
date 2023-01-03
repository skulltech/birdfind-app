import { createStyles, Navbar } from "@mantine/core";
import { useSupabaseClient } from "@supabase/auth-helpers-react";
import { IconLogout } from "@tabler/icons";
import { useRouter } from "next/router";
import { accountMenuItems } from "../utils/helpers";

const useStyles = createStyles((theme, _params, getRef) => {
  const icon = getRef("icon");
  return {
    header: {
      paddingBottom: theme.spacing.md,
      marginBottom: theme.spacing.md * 1.5,
      borderBottom: `1px solid ${
        theme.colorScheme === "dark"
          ? theme.colors.dark[4]
          : theme.colors.gray[2]
      }`,
    },

    footer: {
      paddingTop: theme.spacing.md,
      marginTop: theme.spacing.md,
      borderTop: `1px solid ${
        theme.colorScheme === "dark"
          ? theme.colors.dark[4]
          : theme.colors.gray[2]
      }`,
    },

    link: {
      ...theme.fn.focusStyles(),
      display: "flex",
      alignItems: "center",
      textDecoration: "none",
      fontSize: theme.fontSizes.sm,
      color:
        theme.colorScheme === "dark"
          ? theme.colors.dark[1]
          : theme.colors.gray[7],
      padding: `${theme.spacing.xs}px ${theme.spacing.sm}px`,
      borderRadius: theme.radius.sm,
      fontWeight: 500,

      "&:hover": {
        backgroundColor:
          theme.colorScheme === "dark"
            ? theme.colors.dark[6]
            : theme.colors.gray[0],
        color: theme.colorScheme === "dark" ? theme.white : theme.black,

        [`& .${icon}`]: {
          color: theme.colorScheme === "dark" ? theme.white : theme.black,
        },
      },
    },

    linkIcon: {
      ref: icon,
      color:
        theme.colorScheme === "dark"
          ? theme.colors.dark[2]
          : theme.colors.gray[6],
      marginRight: theme.spacing.sm,
    },

    linkActive: {
      "&, &:hover": {
        backgroundColor: theme.fn.variant({
          variant: "light",
          color: theme.primaryColor,
        }).background,
        color: theme.fn.variant({ variant: "light", color: theme.primaryColor })
          .color,
        [`& .${icon}`]: {
          color: theme.fn.variant({
            variant: "light",
            color: theme.primaryColor,
          }).color,
        },
      },
    },
  };
});

type AccountNavbarProps = {
  activePage: string;
};

export const AccountNavbar = ({ activePage }: AccountNavbarProps) => {
  const { classes, cx } = useStyles();
  const router = useRouter();
  const supabase = useSupabaseClient();

  return (
    <Navbar height={680} width={{ sm: 300 }} p="md">
      <Navbar.Section grow>
        {accountMenuItems.map((item) => (
          <a
            className={cx(classes.link, {
              [classes.linkActive]: item.page === activePage,
            })}
            href={"/account/" + item.page}
            key={item.page}
            onClick={(event) => {
              event.preventDefault();
              router.push("/account/" + item.page);
            }}
          >
            <item.icon className={classes.linkIcon} stroke={1.5} />
            <span>{item.label}</span>
          </a>
        ))}
      </Navbar.Section>
      <Navbar.Section className={classes.footer}>
        <a
          href="#"
          className={classes.link}
          onClick={(event) => {
            event.preventDefault();
            supabase.auth.signOut();
            window.location.replace("/auth/signin");
          }}
          style={{ color: "red" }}
        >
          <IconLogout className={classes.linkIcon} stroke={1.5} color="red" />
          <span>Sign out</span>
        </a>
      </Navbar.Section>
    </Navbar>
  );
};
