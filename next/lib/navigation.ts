import {
  Activity,
  CalendarDays,
  ChartNoAxesColumnIncreasing,
  GitFork,
  House,
  KeyRound,
  ListOrdered,
  ScrollText,
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
    label: "Tournament",
    items: [
      { title: "Overview", href: "/dashboard", icon: House },
      { title: "Live Scores", href: "/dashboard/live-scores", icon: Activity },
      { title: "Fixtures", href: "/dashboard/fixtures", icon: CalendarDays },
      { title: "Standings", href: "/dashboard/standings", icon: ListOrdered },
      { title: "Brackets", href: "/dashboard/brackets", icon: GitFork },
    ],
  },
  {
    label: "People & Records",
    items: [
      { title: "Players", href: "/dashboard/players", icon: Users },
      { title: "Leaderboards", href: "/dashboard/leaderboards", icon: Trophy },
      { title: "Audit Trail", href: "/dashboard/audit-trail", icon: ScrollText },
      { title: "Access", href: "/dashboard/access", icon: KeyRound },
    ],
  },
];

export function getPageTitle(pathname: string) {
  return (
    navigation.flatMap((group) => group.items).find((item) => item.href === pathname)?.title ??
    "Dashboard"
  );
}

export const overviewMetrics = [
  { label: "Live matches", icon: Activity },
  { label: "Upcoming fixtures", icon: CalendarDays },
  { label: "Registered teams", icon: ChartNoAxesColumnIncreasing },
  { label: "Players", icon: Users },
] as const;
