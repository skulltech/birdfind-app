import { useUser } from "@supabase/auth-helpers-react";
import { SearchPage } from "../components/SearchPage";
import { LoginPage } from "../components/LoginPage";
import { useEffect } from "react";
import axios from "axios";

const Home = () => {
  const user = useUser();

  return user ? <SearchPage /> : <LoginPage />;
};

export default Home;
