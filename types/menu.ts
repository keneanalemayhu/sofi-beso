// types/menu.ts

export type MenuRow = {
  id: string;
  category_id: string;
  name: string;
  price: string | number;
  is_active: boolean;
  created_at?: string;
  category_name: string;
  /** Orders in this branch that included the item, last 30 days (newer backends). */
  order_count?: number;
};