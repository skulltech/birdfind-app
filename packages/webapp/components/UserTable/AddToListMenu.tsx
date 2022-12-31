import { ActionIcon, Button, Group, Menu, Text } from "@mantine/core";
import { showNotification } from "@mantine/notifications";
import { useSupabaseClient } from "@supabase/auth-helpers-react";
import { IconChevronDown, IconRefresh, IconSquarePlus } from "@tabler/icons";
import axios from "axios";
import { useEffect, useState } from "react";
import { useTwipsJobs } from "../../providers/TwipsJobsProvider";
import { useTwipsUser } from "../../providers/TwipsUserProvider";
import { openCreateListModal } from "./CreateListModal";

type AddToListMenuProps = {
  userIds: BigInt[];
};

export const AddToListMenu = ({ userIds }: AddToListMenuProps) => {
  const [lists, setLists] = useState<any[]>(null);
  const [addMembersLoading, setAddMembersLoading] = useState(false);
  const [refreshListsLoading, setRefreshListsLoading] = useState(false);
  const supabase = useSupabaseClient();
  const { user } = useTwipsUser();

  const { refresh } = useTwipsJobs();

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

  const addListMembers = async (listId: BigInt) => {
    setAddMembersLoading(true);

    const { error } = await supabase.from("add_list_members_job").insert({
      user_id: user.id,
      list_id: listId,
      member_ids: userIds,
      priority: 10000,
    });
    if (error) {
      console.log(error);
      showNotification({
        title: "Error",
        message: "Some error ocurred",
        color: "red",
      });
    } else refresh();

    setAddMembersLoading(true);
  };

  // Fetch user's lists from DB on first load
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
        <Button compact>
          <Group position="apart" spacing="xs">
            Add to List
            <IconChevronDown size={14} />
          </Group>
        </Button>
      </Menu.Target>
      <Menu.Dropdown>
        <Menu.Label>
          <Group position="apart">
            <Text>Your lists</Text>
            <ActionIcon onClick={refreshLists} loading={refreshListsLoading}>
              <IconRefresh size={14} />
            </ActionIcon>
          </Group>
        </Menu.Label>
        {Boolean(lists?.length) && (
          <>
            {lists.map((list) => (
              <Menu.Item
                key={list.id.toString()}
                onClick={() => addListMembers(list.id)}
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
  );
};
