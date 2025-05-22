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
    title: "About",
    newTab: false,
    submenu: [
      {
        id: 21,
        title: "About Us",
        newTab: false,
        path: "/about",
      }
    ],
  },
  {
    id: 3,
    title: "Blog",
    newTab: false,
    path: "/blog",
  },
  {
    id: 7,
    title: "AI Services",
    newTab: false,
    submenu: [
      {
        id: 22,
        title: "AI Voice Assistant",
        newTab: false,
        path: "/ai/assistant",
      },
      {
        id: 23,
        title: "AI Agents",
        newTab: false,
        path: "/ai-agents",
      },
      {
      id: 4,
      title: "AI Services",
      path: "/ai-services",
      newTab: false,
    },
      // {
      //   id: 71,
      //   title: "Chat Bot",
      //   newTab: false,
      //   path: "/ai/chat",
      // },
      // {
      //   id: 72,
      //   title: "GPT-4",
      //   newTab: false,
      //   path: "/ai/gpt4",
      // },
      // {
      //   id: 73,
      //   title: "Llama 3",
      //   newTab: false,
      //   path: "/ai/llama",
      // }
    ],
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
