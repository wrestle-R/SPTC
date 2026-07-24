import {
  Activity,
  CalendarDays,
  House,
  Medal,
  SlidersHorizontal,
  Settings,
  Trophy,
  Users,
} from "lucide-react";
import type { ComponentType } from "react";

export type NavItem = {
  title: string;
  href: string;
  icon: ComponentType;
};

export type NavGroup = {
  label: string;
  items: NavItem[];
};

export const navigation: NavGroup[] = [
  {
    label: "Organizer",
    items: [
      { title: "Home", href: "/organizer", icon: House },
      { title: "Matches", href: "/organizer/matches", icon: CalendarDays },
      { title: "Teams", href: "/organizer/teams", icon: Users },
      { title: "Awards", href: "/organizer/awards", icon: Medal },
      { title: "Miscellaneous", href: "/organizer/miscellaneous", icon: SlidersHorizontal },
      { title: "Settings", href: "/organizer/settings", icon: Settings },
    ],
  },
];

export function getPageTitle(pathname: string) {
  return (
    navigation.flatMap((group) => group.items).find((item) => item.href === pathname)?.title ??
    "Organizer"
  );
}

export const overviewMetrics = [
  { key: "live", label: "Live matches", icon: Activity },
  { key: "fixtures", label: "Upcoming fixtures", icon: CalendarDays },
  { key: "teams", label: "Registered teams", icon: Trophy },
  { key: "players", label: "Players", icon: Users },
] as const;
