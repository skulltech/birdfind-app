import { ActionIcon, Button, Group, Loader, Menu, Text } from "@mantine/core";
import { showNotification } from "@mantine/notifications";
import { useSupabaseClient } from "@supabase/auth-helpers-react";
import {
  IconChevronDown,
  IconChevronRight,
  IconCircleCheck,
  IconForbid2,
  IconList,
  IconRefresh,
  IconSquarePlus,
  IconUserMinus,
  IconUserPlus,
  IconVolume,
  IconVolume3,
  TablerIcon,
} from "@tabler/icons";
import axios from "axios";
import { useEffect, useState } from "react";
import { useTwipsJobs } from "../../providers/TwipsJobsProvider";
import { useTwipsUser } from "../../providers/TwipsUserProvider";
import { openCreateListModal } from "./CreateListModal";

type ActionMenuProps = {
  userIds: BigInt[];
};

type Relation = "follow" | "block" | "mute";

type ManageRelationMenuItemProps = {
  icon: TablerIcon;
  label: string;
  onClick: () => Promise<void>;
};

const ManageRelationMenuItem = (props: ManageRelationMenuItemProps) => {
  const [loading, setLoading] = useState(false);

  return (
    <Menu.Item
      icon={<props.icon size={14} />}
      onClick={() => {
        setLoading(true);
        props.onClick();
        setLoading(false);
      }}
      rightSection={loading ?? <Loader size={14} />}
    >
      {props.label}
    </Menu.Item>
  );
};

type ManageListMembersMenuItemsProps = {
  onClick: () => Promise<void>;
  label: string;
};

const ManageListMembersMenuItem = (props: ManageListMembersMenuItemsProps) => {
  const [loading, setLoading] = useState(false);

  return (
    <Menu.Item
      onClick={() => {
        setLoading(true);
        props.onClick();
        setLoading(false);
      }}
      rightSection={loading ?? <Loader size={14} />}
    >
      {props.label}
    </Menu.Item>
  );
};

export const BulkActionMenu = ({ userIds }: ActionMenuProps) => {
  const [menuOpened, setMenuOpened] = useState(false);
  const [lists, setLists] = useState<any[]>(null);
  const [refreshListsLoading, setRefreshListsLoading] = useState(false);
  const supabase = useSupabaseClient();
  const { user } = useTwipsUser();
  const { refresh: refreshJobs } = useTwipsJobs();

  // Add or remove relation
  const manageRelation = async (relation: Relation, add: boolean) => {
    try {
      await axios.get("/api/twips/manage-relation", {
        params: { targetId: userIds[0], relation, add },
      });
    } catch (error) {
      console.log(error);
      showNotification({
        title: "Error",
        message: "Some error ocurred",
        color: "red",
      });
    }
  };

  // Refresh lists
  const refreshLists = async () => {
    setRefreshListsLoading(true);

    try {
      const response = await axios.get("/api/twips/lookup-lists");
      const lists = response.data.map((x: any) => {
        return { ...x, id: BigInt(x.id) };
      });
      setLists(lists);
    } catch (error) {
      console.log(error);
      showNotification({
        title: "Error",
        message: "Some error ocurred",
        color: "red",
      });
    }

    setRefreshListsLoading(false);
  };

  // Add or remove list members
  const manageListMembers = async (listId: BigInt, add: boolean) => {
    const { error } = await supabase.from("manage_list_members_job").insert({
      user_id: user.id,
      list_id: listId,
      member_ids: userIds,
      priority: 10000,
      add,
    });
    if (error) {
      console.log(error);
      showNotification({
        title: "Error",
        message: "Some error ocurred",
        color: "red",
      });
    } else refreshJobs();
  };

  // Fetch user owned lists from DB on first load
  useEffect(() => {
    const fetchLists = async () => {
      const { data } = await supabase
        .from("twitter_list")
        .select("id::text,name")
        .throwOnError();

      const lists = data.map((x: any) => {
        return { ...x, id: BigInt(x.id) };
      });
      setLists(lists);
    };

    fetchLists();
  }, [supabase]);

  return (
    <Menu
      shadow="md"
      width={200}
      opened={menuOpened}
      onChange={setMenuOpened}
      closeOnItemClick={false}
    >
      <Menu.Target>
        <Button compact variant="default">
          <Group spacing="xs">
            Actions
            <IconChevronDown size={14} />
          </Group>
        </Button>
      </Menu.Target>

      <Menu.Dropdown>
        <ManageRelationMenuItem
          icon={IconUserPlus}
          onClick={() => manageRelation("follow", true)}
          label="Follow"
        />
        <ManageRelationMenuItem
          icon={IconUserMinus}
          onClick={() => manageRelation("follow", false)}
          label="Unfollow"
        />
        <Menu.Divider />

        <ManageRelationMenuItem
          icon={IconForbid2}
          onClick={() => manageRelation("block", true)}
          label="Block"
        />
        <ManageRelationMenuItem
          icon={IconCircleCheck}
          onClick={() => manageRelation("block", false)}
          label="Unblock"
        />
        <Menu.Divider />

        <ManageRelationMenuItem
          icon={IconVolume3}
          onClick={() => manageRelation("mute", true)}
          label="Block"
        />
        <ManageRelationMenuItem
          icon={IconVolume}
          onClick={() => manageRelation("mute", false)}
          label="Unblock"
        />
        <Menu.Divider />

        <Menu.Item>
          <Menu position="right" trigger="hover" offset={18}>
            <Menu.Target>
              <Group position="apart">
                <Group spacing={10}>
                  <IconList size={14} />
                  <Text>List</Text>
                </Group>
                <IconChevronRight size={14} />
              </Group>
            </Menu.Target>
            <Menu.Dropdown>
              <Menu.Label>
                <Group position="apart">
                  <Text>Your lists</Text>
                  <ActionIcon
                    onClick={refreshLists}
                    loading={refreshListsLoading}
                  >
                    <IconRefresh size={14} />
                  </ActionIcon>
                </Group>
              </Menu.Label>
              {Boolean(lists?.length) && (
                <>
                  {lists.map((list) => (
                    <ManageListMembersMenuItem
                      key={list.id.toString()}
                      onClick={() => manageListMembers(list.id, true)}
                      label={list.name}
                    />
                  ))}
                  <Menu.Divider />
                </>
              )}
              <Menu.Item
                icon={<IconSquarePlus size={14} />}
                onClick={() => {
                  setMenuOpened(false);
                  openCreateListModal();
                }}
              >
                Create list
              </Menu.Item>
            </Menu.Dropdown>
          </Menu>
        </Menu.Item>
      </Menu.Dropdown>
    </Menu>
  );
};
