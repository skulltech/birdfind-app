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
  px: number | string;
  colorScheme: ColorScheme | "system";
  changeColorScheme: (arg: ColorScheme | "system") => void;
};

const abrilFatface = Abril_Fatface({ weight: "400", subsets: ["latin"] });

export const AppHeader = ({
  colorScheme,
  changeColorScheme,
  px,
}: AppHeaderProps) => {
  const router = useRouter();
  const { user } = useUser();

  return (
    <Header height={60} py="xs" px={px}>
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
              src="/images/birdfind.png"
              alt="Twitter logo"
              width={34}
              height={34}
            />
            <Title order={2} className={abrilFatface.className}>
              Birdfind
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
