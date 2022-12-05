import { SearchPage } from "../components/SearchPage";
import { LoginPage } from "../components/LoginPage";
import { signIn, useSession } from "next-auth/react";
import { useRouter } from "next/router";

const Home = () => {
  return <SearchPage />;
};

export default Home;
