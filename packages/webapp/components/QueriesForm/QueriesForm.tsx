import {
  ActionIcon,
  Button,
  createStyles,
  Group,
  Popover,
  Stack,
  Text,
  UnstyledButton,
} from "@mantine/core";
import { useSupabaseClient } from "@supabase/auth-helpers-react";
import { IconChevronLeft } from "@tabler/icons";
import { useEffect, useState } from "react";
import { useUser } from "../../providers/UserProvider";
import { Queries } from "../../utils/helpers";
import { QueryChipGroup } from "../FilterPanel/Chips/QueryChipGroup";
import { UsernameForm } from "./UsernameForm";

const useStyles = createStyles((theme) => ({
  queryItem: {
    backgroundColor:
      theme.colorScheme === "dark" ? theme.colors.dark[6] : theme.colors.white,
    padding: theme.spacing.xs,
    borderRadius: theme.radius.sm,
    fontSize: theme.fontSizes.sm,

    "&:hover": {
      backgroundColor:
        theme.colorScheme === "dark"
          ? theme.colors.dark[4]
          : theme.colors.gray[0],
    },
  },
}));

type DropdownContent = "initial" | "followerOf" | "followedBy";

type QueryFormShellProps = {
  label: string;
  setDropdownContent: (content: DropdownContent) => void;
  children: React.ReactNode;
};

const QueryFormShell = ({
  label,
  setDropdownContent,
  children,
}: QueryFormShellProps) => {
  return (
    <Stack spacing={0}>
      <Group style={{ position: "relative" }} position="center">
        <ActionIcon
          onClick={() => {
            setDropdownContent("initial");
          }}
          color="blue"
          style={{
            left: 0,
            position: "absolute",
          }}
        >
          <IconChevronLeft />
        </ActionIcon>
        <Text>{label}</Text>
      </Group>
      {children}
    </Stack>
  );
};

export const QueriesForm = () => {
  const [queries, setQueries] = useState<Queries>([]);
  const [popoverOpened, setPopoverOpened] = useState(false);
  const supabase = useSupabaseClient();
  const { user } = useUser();

  const { classes } = useStyles();

  const [dropdownContent, setDropdownContent] =
    useState<DropdownContent>("initial");
  const popoverWidth = dropdownContent == "initial" ? 200 : 400;
  const [createCampaignLoading, setCreateCampaignLoading] = useState(false);

  const dropdownContents = {
    initial: (
      <Stack spacing={0}>
        <UnstyledButton
          onClick={() => setDropdownContent("followerOf")}
          className={classes.queryItem}
        >
          Follower of
        </UnstyledButton>
        <UnstyledButton
          onClick={() => setDropdownContent("followedBy")}
          className={classes.queryItem}
        >
          Followed by
        </UnstyledButton>
      </Stack>
    ),
    followerOf: (
      <QueryFormShell {...{ label: "Follower of", setDropdownContent }}>
        <UsernameForm
          {...{
            onSubmit: (profile) => {
              setQueries([...queries, ["followerOf", profile.username]]);
              setPopoverOpened(false);
            },
          }}
        />
      </QueryFormShell>
    ),
    followedBy: (
      <QueryFormShell {...{ label: "Followed by", setDropdownContent }}>
        <UsernameForm
          {...{
            onSubmit: (profile) => {
              setQueries([...queries, ["followerOf", profile.username]]);
              setPopoverOpened(false);
            },
          }}
        />
      </QueryFormShell>
    ),
  };

  // Reset dropdown content to initial when popover is opened
  useEffect(() => {
    if (popoverOpened) setDropdownContent("initial");
  }, [popoverOpened]);

  const createCampaign = async () => {
    console.log(queries);
    setCreateCampaignLoading(true);

    try {
      const { data } = await supabase
        .from("user_campaign")
        .insert({ queries, user_id: user.id })
        .select("id")
        .throwOnError()
        .single();
      console.log(data.id);
    } catch (error) {
      console.log(error);
    }
    setCreateCampaignLoading(false);
  };

  return (
    <Stack>
      <Group p="md">
        <QueryChipGroup {...{ queries, setQueries }} />
        <Popover
          width={popoverWidth}
          position="bottom-start"
          shadow="md"
          opened={popoverOpened}
          onChange={setPopoverOpened}
        >
          <Popover.Target>
            <Button onClick={() => setPopoverOpened((o) => !o)}>
              Add query
            </Button>
          </Popover.Target>
          <Popover.Dropdown p={4}>
            {dropdownContents[dropdownContent]}
          </Popover.Dropdown>
        </Popover>
      </Group>
      <Button onClick={createCampaign} loading={createCampaignLoading}>
        Create campaign
      </Button>
    </Stack>
  );
};
