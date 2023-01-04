import { ActionIcon, Group, Loader, Menu, Text } from "@mantine/core";
import { showNotification } from "@mantine/notifications";
import { useSupabaseClient } from "@supabase/auth-helpers-react";
import {
  IconChevronRight,
  IconCircleCheck,
  IconForbid2,
  IconList,
  IconRefresh,
  IconSquarePlus,
  IconUserPlus,
  IconVolume,
  IconVolume3,
  TablerIcon,
} from "@tabler/icons";
import axios from "axios";
import { ReactNode, useState } from "react";
import { useUser } from "../../providers/TwipsUserProvider";
import { SearchResult } from "../../utils/supabase";
import { openCreateListModal } from "./CreateListModal";

interface ActionMenuProps {
  users: SearchResult[];
  target: ReactNode;
  lists: any[];
  refreshLists: () => void;
  listsLoading: boolean;
  refreshSearch: (silent?: boolean) => void;
}

type Relation = "follow" | "block" | "mute";

type ManageRelationMenuItemProps = {
  icon: TablerIcon;
  label: string;
  onClick: () => Promise<void>;
};

const ManageRelationMenuItem = ({
  icon: Icon,
  label,
  onClick,
}: ManageRelationMenuItemProps) => {
  const [loading, setLoading] = useState(false);

  return (
    <Menu.Item
      icon={<Icon size={14} />}
      onClick={async () => {
        setLoading(true);
        await onClick();
        setLoading(false);
      }}
      rightSection={loading && <Loader size={14} />}
    >
      {label}
    </Menu.Item>
  );
};

type ManageListMembersMenuItemsProps = {
  onClick: () => Promise<void>;
  label: string;
};

const ManageListMembersMenuItem = ({
  onClick,
  label,
}: ManageListMembersMenuItemsProps) => {
  const [loading, setLoading] = useState(false);

  return (
    <Menu.Item
      onClick={async () => {
        setLoading(true);
        await onClick();
        setLoading(false);
      }}
      rightSection={loading ?? <Loader size={14} />}
    >
      {label}
    </Menu.Item>
  );
};

export const ActionMenu = ({
  users,
  target,
  lists,
  listsLoading,
  refreshLists,
}: ActionMenuProps) => {
  const [menuOpened, setMenuOpened] = useState(false);
  const supabase = useSupabaseClient();
  const { user } = useUser();
  const singleInputUser = users.length == 1 ? users[0] : null;

  // Add or remove relation
  const manageRelation = async (relation: Relation, add: boolean) => {
    try {
      if (singleInputUser)
        await axios.get("/api/twips/manage-relation", {
          params: { targetId: singleInputUser.id, relation, add },
        });
      else
        await supabase
          .from("manage_relation_job")
          .insert({
            user_id: user.id,
            target_ids: users.map((x) => x.id),
            priority: 10000,
            relation,
            add,
          })
          .throwOnError();
    } catch (error) {
      console.log(error);
      showNotification({
        title: "Error",
        message: "Some error ocurred",
        color: "red",
      });
    }

    if (singleInputUser) {
      showNotification({
        title: "Success",
        message: `Successfully ${
          add
            ? relation == "follow"
              ? "followed"
              : relation == "block"
              ? "blocked"
              : relation == "mute"
              ? "muted"
              : null
            : relation == "block"
            ? "unblocked"
            : relation == "follow"
            ? "unfollowed"
            : relation == "mute"
            ? "unmuted"
            : null
        } @${singleInputUser.username}`,
        color: "green",
      });
      // refreshSearch();
    }
  };

  // Add or remove list members
  const manageListMembers = async (listId: BigInt, add: boolean) => {
    const { error } = await supabase.from("manage_list_members_job").insert({
      user_id: user.id,
      list_id: listId,
      member_ids: users.map((x) => x.id),
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
    }
  };

  return (
    <Menu
      shadow="md"
      width={200}
      opened={menuOpened}
      onChange={setMenuOpened}
      closeOnItemClick={false}
    >
      <Menu.Target>{target}</Menu.Target>

      <Menu.Dropdown>
        {singleInputUser && singleInputUser.isFollowing ? null : (
          <ManageRelationMenuItem
            icon={IconUserPlus}
            onClick={async () => {
              await manageRelation("follow", true);
              setMenuOpened(false);
            }}
            label="Follow"
          />
        )}
        {singleInputUser && !singleInputUser.isFollowing ? null : (
          <ManageRelationMenuItem
            icon={IconUserPlus}
            onClick={async () => {
              await manageRelation("follow", false);
              setMenuOpened(false);
            }}
            label="Unfollow"
          />
        )}
        {!singleInputUser && <Menu.Divider />}

        {singleInputUser && singleInputUser.isBlocked ? null : (
          <ManageRelationMenuItem
            icon={IconForbid2}
            onClick={async () => {
              await manageRelation("block", true);
              setMenuOpened(false);
            }}
            label="Block"
          />
        )}
        {singleInputUser && !singleInputUser.isBlocked ? null : (
          <ManageRelationMenuItem
            icon={IconCircleCheck}
            onClick={async () => {
              await manageRelation("block", false);
              setMenuOpened(false);
            }}
            label="Unblock"
          />
        )}
        {!singleInputUser && <Menu.Divider />}

        {singleInputUser && singleInputUser.isMuted ? null : (
          <ManageRelationMenuItem
            icon={IconVolume3}
            onClick={async () => {
              await manageRelation("mute", true);
              setMenuOpened(false);
            }}
            label="Mute"
          />
        )}
        {singleInputUser && !singleInputUser.isMuted ? null : (
          <ManageRelationMenuItem
            icon={IconVolume}
            onClick={async () => {
              await manageRelation("mute", false);
              setMenuOpened(false);
            }}
            label="Unmute"
          />
        )}
        {!singleInputUser && <Menu.Divider />}

        <Menu.Item>
          <Menu position="right" trigger="hover" offset={18}>
            <Menu.Target>
              <Group position="apart">
                <Group spacing={10}>
                  <IconList size={14} />
                  <Text>Add to list</Text>
                </Group>
                <IconChevronRight size={14} />
              </Group>
            </Menu.Target>
            <Menu.Dropdown>
              <Menu.Label>
                <Group position="apart">
                  <Text>Your lists</Text>
                  <ActionIcon onClick={refreshLists} loading={listsLoading}>
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
