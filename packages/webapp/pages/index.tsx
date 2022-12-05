import { SearchPage } from "../components/SearchPage";
import { LoginPage } from "../components/LoginPage";
import { useSession } from "next-auth/react";

const Home = () => {
  const { data: session } = useSession();

  return session ? <SearchPage /> : <LoginPage />;
};

export default Home;
