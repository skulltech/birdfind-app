import { supabase } from "./utils";

export const removeEvents = async (email: string) => {
  const { data, error: selectEmailError } = await supabase
    .from("user_profile")
    .select("id")
    .eq("email", email);
  if (selectEmailError) throw selectEmailError;
  const userId = data[0].id;

  const { error: deleteEventsError } = await supabase
    .from("user_event")
    .delete()
    .eq("user_id", userId);
  if (deleteEventsError) throw deleteEventsError;
};
