import { Filters } from "../FilterForm/FilterForm";

export const largeNumberFormatter = (value: number): string => {
  if (value < 1e3) return value.toString();
  if (value >= 1e3 && value < 1e6)
    return (value / 1e3).toFixed(1).replace(/\.0$/, "") + "k";
  if (value >= 1e6) return (value / 1e6).toFixed(1).replace(/\.0$/, "") + "m";
};

export type CampaignResultsProps = {
  campaign: any;
  filters: Filters;
};
