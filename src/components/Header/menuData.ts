import { Menu } from "@/types/menu";

const menuData: Menu[] = [
  {
    id: 1,
    title: "Home",
    newTab: false,
    path: "/",
  },
  {
    id: 2,
    title: "Journal",
    newTab: false,
    path: "/journal/journal",
  },
  {
    id: 3,
    title: "Insights",
    newTab: false,
    path: "/journal/analysis",
  },
  {
    id: 4,
    title: "Lists",
    newTab: false,
    path: "/journal/lists",
  },
  {
    id: 5,
    title: "Reminders",
    newTab: false,
    path: "/journal/date-reminders",
  },
  {
    id: 6,
    title: "About",
    newTab: false,
    path: "/about",
  },
  {
    id: 8,
    title: "Account",
    newTab: false,
    requireAuth: true,
    hideIfNotAuth: true,
    submenu: [
      {
        id: 61,
        title: "Profile",
        newTab: false,
        path: "/account/profile",
      },
      {
        id: 62,
        title: "Subscription",
        newTab: false,
        path: "/account/subscription",
      },
      {
        id: 63,
        title: "Settings",
        newTab: false,
        path: "/account/settings",
      }
    ],
  }
];

export default menuData;
