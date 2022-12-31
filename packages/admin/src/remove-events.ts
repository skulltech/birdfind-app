import { supabase } from "./utils";

export const removeEvents = async (email: string) => {
  const { data } = await supabase
    .from("user_profile")
    .select("id")
    .eq("email", email)
    .throwOnError();

  const userId = data[0].id;

  await supabase
    .from("user_event")
    .delete()
    .eq("user_id", userId)
    .throwOnError();
};
