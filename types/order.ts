// @/types/order.ts

export type OrderStatus = "pending" | "completed" | "voided";
export type ServingMode = "individual" | "shared_tray";

export type Order = {
  serving_mode: ServingMode;
  waiter_name: string;
  id: string;
  order_number?: number;
  waiter_id: string | null;
  created_by: string;
  status: OrderStatus;
  total_amount: string | number;
  created_at: string;
  completed_at?: string | null;
  voided_at?: string | null;
  voided_by?: string | null;
  void_reason?: string | null;
};

export type OrderItem = {
  id: string;
  order_id: string;
  menu_item_id: string;
  quantity: number;
  price_at_time: string | number;
  comment?: string | null;
  name: string;
};

export type ActiveOrderItem = {
  id: string;
  order_id: string;
  menu_item_id: string;
  name: string;
  quantity: number;
  price_at_time: number;
  comment: string | null;
};

export type ActiveOrder = {
  order: {
    serving_mode: ServingMode;
    waiter_name: string;
    id: string;
    waiter_id: string | null;
    created_by: string;
    status: OrderStatus;
    total_amount: number;
    created_at: string;
    completed_at: string | null;
    voided_at?: string | null;
    voided_by?: string | null;
    void_reason?: string | null;
  };
  items: ActiveOrderItem[];
};

export type OrderWithItems = {
  order: Order;
  items: OrderItem[];
};