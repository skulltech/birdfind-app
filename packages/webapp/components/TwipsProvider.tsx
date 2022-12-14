import axios from "axios";
import { createContext, useContext, useEffect, useState } from "react";
import { Filters } from "../utils/helpers";
import { getUserDetails, UserDetails } from "../utils/supabase";

export const usernameFilters = ["followerOf", "followedBy"];

const TwipsContext = createContext<{
  user: UserDetails;
  filters: Filters;
  addFilters: (arg: Partial<Filters>) => void;
  removeFilters: (arg: Partial<Filters>) => void;
  userIds: Record<string, BigInt>;
  addUserId: (username: string, userId: BigInt) => void;
}>({
  user: null,
  filters: {},
  addFilters: () => {},
  removeFilters: () => {},
  userIds: {},
  addUserId: () => {},
});

export const TwipsProvider = ({ supabase, children }) => {
  const [user, setUser] = useState<UserDetails>(null);
  const [filters, setFilters] = useState<Filters>({});
  const [userIds, setUserIds] = useState<Record<string, BigInt>>({});

  // Load user details
  useEffect(() => {
    const loadUserDetails = async () => {
      const user = await getUserDetails(supabase);
      setUser(user);
      if (user && user.twitter) await axios.get("/api/twips/add-crons");
    };
    loadUserDetails();
  }, [supabase]);

  // Add filters
  const addFilters = (arg: Partial<Filters>) => {
    const updatedFilters = { ...filters };

    for (const [filterName, filterValue] of Object.entries(arg)) {
      if (usernameFilters.includes(filterName)) {
        const updatedValue = new Set<string>();

        if (filters[filterName])
          filters[filterName].forEach((item: string) => updatedValue.add(item));

        if (filterValue)
          (filterValue as string[]).forEach((item: string) =>
            updatedValue.add(item)
          );

        if (updatedValue.size)
          updatedFilters[filterName] = Array.from(updatedValue);
      } else {
        if (filterValue) updatedFilters[filterName] = filterValue;
        else delete updatedFilters[filterName];
      }
    }

    setFilters(updatedFilters);
  };

  // Remove filters
  const removeFilters = (arg: Partial<Filters>) => {
    const updatedFilters = { ...filters };

    for (const [filterName, filterValue] of Object.entries(arg)) {
      if (usernameFilters.includes(filterName)) {
        const updatedValue = new Set<string>(filters[filterName]);
        if (filterValue)
          (filterValue as string[]).forEach((item: string) =>
            updatedValue.delete(item)
          );

        if (updatedValue.size)
          updatedFilters[filterName] = Array.from(updatedValue);
        else delete updatedFilters[filterName];
      } else delete updatedFilters[filterName];
    }

    setFilters(updatedFilters);
  };

  // Add a username userId pair to the cache
  const addUserId = (username: string, userId: BigInt) => {
    const updatedUserIds = { ...userIds };
    updatedUserIds[username] = userId;
    setUserIds(updatedUserIds);
  };

  return (
    <TwipsContext.Provider
      value={{ user, filters, addFilters, removeFilters, userIds, addUserId }}
    >
      {children}
    </TwipsContext.Provider>
  );
};

export const useTwips = () => useContext(TwipsContext);
