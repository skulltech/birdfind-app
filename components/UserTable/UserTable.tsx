import { Table } from "@mantine/core";

export type UserTableProps = {
  users: any[];
};

export const UserTable = ({ users }: UserTableProps) => {
  const ths = (
    <tr>
      <th>Username</th>
      <th>Name</th>
    </tr>
  );

  const rows = users.map((user) => (
    <tr key={user.username}>
      <td>{user.username}</td>
      <td>{user.name}</td>
    </tr>
  ));

  return (
    <Table>
      <caption>Users</caption>
      <thead>{ths}</thead>
      <tbody>{rows}</tbody>
    </Table>
  );
};
