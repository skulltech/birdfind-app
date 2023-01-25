import {
  ColorScheme,
  Group,
  Header,
  Title,
  UnstyledButton,
  Image,
} from "@mantine/core";
import { useRouter } from "next/router";
import { useUser } from "../../providers/UserProvider";
import { AccountMenu } from "./AccountMenu";
import { Abril_Fatface } from "@next/font/google";

type AppHeaderProps = {
  [x: string]: any;
  colorScheme: ColorScheme | "system";
  changeColorScheme: (arg: ColorScheme | "system") => void;
};

const abrilFatface = Abril_Fatface({ weight: "400", subsets: ["latin"] });

export const AppHeader = ({
  colorScheme,
  changeColorScheme,
  ...others
}: AppHeaderProps) => {
  const router = useRouter();
  const { user } = useUser();

  return (
    <Header height={60} {...others}>
      <Group position="apart">
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
              @birdfind_xyz
            </Title>
          </Group>
        </UnstyledButton>

        {user && (
          <AccountMenu
            colorScheme={colorScheme}
            changeColorScheme={changeColorScheme}
          />
        )}
      </Group>
    </Header>
  );
};
