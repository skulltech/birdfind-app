import { Filters } from "@twips/lib";
import { createContext, useContext, useEffect, useState } from "react";
import { usernameFilters } from "../utils/helpers";
import { getUserDetails, UserDetails } from "../utils/supabase";

const TwipsContext = createContext<{
  user: UserDetails;
  filters: Filters;
  addFilters: (arg: Partial<Filters>) => void;
  removeFilters: (arg: Partial<Filters>) => void;
}>({ user: null, filters: {}, addFilters: () => {}, removeFilters: () => {} });

export const TwipsProvider = ({ supabase, children }) => {
  const [user, setUser] = useState<UserDetails>(null);
  const [filters, setFilters] = useState<Filters>({});

  // Load user details
  useEffect(() => {
    const loadUserDetails = async () => {
      setUser(await getUserDetails(supabase));
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

  return (
    <TwipsContext.Provider value={{ user, filters, addFilters, removeFilters }}>
      {children}
    </TwipsContext.Provider>
  );
};

export const useTwips = () => useContext(TwipsContext);
