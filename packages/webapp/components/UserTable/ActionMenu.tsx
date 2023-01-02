import { ActionIcon, Button, Group, Menu, Text } from "@mantine/core";
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

export const ActionMenu = ({ userIds }: ActionMenuProps) => {
  const [lists, setLists] = useState<any[]>(null);
  const [manageRelationLoading, setManageRelationLoading] = useState(false);
  const [manageListMembersLoading, setManageListMembersLoading] =
    useState(false);
  const [refreshListsLoading, setRefreshListsLoading] = useState(false);
  const supabase = useSupabaseClient();
  const { user } = useTwipsUser();
  const { refresh: refreshJobs } = useTwipsJobs();

  // Add or remove relation
  const manageRelation = async (relation: Relation, add: boolean) => {
    setManageRelationLoading(true);

    const res = await axios.get("/api/twips/manage-relation", {
      params: { targetId: userIds[0], relation, add },
    });
    if (res.status != 200)
      showNotification({
        title: "Error",
        message:
          "Some error ocurred. You may have been rate limited. Please try again later.",
        color: "red",
      });

    setManageRelationLoading(false);
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
    setManageListMembersLoading(true);

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

    setManageListMembersLoading(true);
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
    <Menu shadow="md" width={200}>
      <Menu.Target>
        <Button compact variant="default">
          <Group spacing="xs">
            Actions
            <IconChevronDown size={14} />
          </Group>
        </Button>
      </Menu.Target>

      <Menu.Dropdown>
        <Menu.Item
          icon={<IconUserPlus size={14} />}
          onClick={() => manageRelation("follow", true)}
        >
          Follow
        </Menu.Item>
        <Menu.Item
          icon={<IconUserMinus size={14} />}
          onClick={() => manageRelation("follow", false)}
        >
          Unfollow
        </Menu.Item>
        <Menu.Divider />

        <Menu.Item
          icon={<IconForbid2 size={14} />}
          onClick={() => manageRelation("block", true)}
        >
          Block
        </Menu.Item>
        <Menu.Item
          icon={<IconCircleCheck size={14} />}
          onClick={() => manageRelation("block", false)}
        >
          Unblock
        </Menu.Item>
        <Menu.Divider />

        <Menu.Item
          icon={<IconVolume3 size={14} />}
          onClick={() => manageRelation("mute", true)}
        >
          Mute
        </Menu.Item>
        <Menu.Item
          icon={<IconVolume size={14} />}
          onClick={() => manageRelation("mute", false)}
        >
          Unmute
        </Menu.Item>

        <Menu.Item>
          <Menu position="right" trigger="hover">
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
                    <Menu.Item
                      key={list.id.toString()}
                      onClick={() => manageListMembers(list.id, true)}
                    >
                      {list.name}
                    </Menu.Item>
                  ))}
                  <Menu.Divider />
                </>
              )}
              <Menu.Item
                icon={<IconSquarePlus size={14} />}
                onClick={openCreateListModal}
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
