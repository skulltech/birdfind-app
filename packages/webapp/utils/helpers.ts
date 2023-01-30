import { createClient } from "@supabase/supabase-js";
import { NextApiRequest } from "next";
import { z } from "zod";

// Custom bigint Zod type
export const zodBigint = z.string().refine((x) => {
  try {
    BigInt(x);
    return true;
  } catch (error) {
    return false;
  }
});

export const getServiceRoleSupabase = () =>
  createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
  );

function isLocalNetwork(hostname = window.location.host) {
  return (
    hostname.startsWith("localhost") ||
    hostname.startsWith("127.0.0.1") ||
    hostname.startsWith("192.168.") ||
    hostname.startsWith("10.0.") ||
    hostname.endsWith(".local")
  );
}

export const getOrigin = (req: NextApiRequest) => {
  const host = req.headers.host;
  const protocol = isLocalNetwork(host) ? "http:" : "https:";
  return protocol + "//" + host;
};
