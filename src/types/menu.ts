export type Menu = {
  id: number;
  title: string;
  path?: string;
  newTab?: boolean;
  submenu?: Menu[];
  requireAuth?: boolean;
  hideIfNotAuth?: boolean;
};
