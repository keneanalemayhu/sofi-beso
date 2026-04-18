import type { OrderWithItems } from "@/types/order";

const now = new Date();
const minutesAgo = (m: number) => new Date(now.getTime() - m * 60_000).toISOString();

export const mockKitchenOrders: OrderWithItems[] = [
  {
    order: {
      id: "o-1",
      order_number: 101,
      waiter_id: "w-1",
      created_by: "cashier",
      status: "pending",
      total_amount: 18.25,
      created_at: minutesAgo(8),
      completed_at: null,
      waiter_name: ""
    },
    items: [
      { id: "oi-1", order_id: "o-1", menu_item_id: "m-burger", quantity: 1, price_at_time: 9.99, comment: "No onions", name: "Classic Burger" },
      { id: "oi-2", order_id: "o-1", menu_item_id: "m-fries", quantity: 2, price_at_time: 3.75, comment: null, name: "French Fries" },
    ],
  },
  {
    order: {
      id: "o-2",
      order_number: 102,
      waiter_id: "w-2",
      created_by: "cashier",
      status: "pending",
      total_amount: 11.0,
      created_at: minutesAgo(5),
      completed_at: null,
      waiter_name: ""
    },
    items: [
      { id: "oi-3", order_id: "o-2", menu_item_id: "m-omelette", quantity: 1, price_at_time: 6.75, comment: "Extra cheese", name: "Cheese Omelette" },
      { id: "oi-4", order_id: "o-2", menu_item_id: "m-water", quantity: 1, price_at_time: 1.0, comment: null, name: "Water" },
      { id: "oi-5", order_id: "o-2", menu_item_id: "m-espresso", quantity: 1, price_at_time: 3.25, comment: "Double shot", name: "Espresso" },
    ],
  },
  {
    order: {
      id: "o-3",
      order_number: 103,
      waiter_id: "w-3",
      created_by: "cashier",
      status: "pending",
      total_amount: 7.5,
      created_at: minutesAgo(2),
      completed_at: null,
      waiter_name: ""
    },
    items: [
      { id: "oi-6", order_id: "o-3", menu_item_id: "m-pancakes", quantity: 1, price_at_time: 7.5, comment: "No syrup", name: "Pancakes (3)" },
    ],
  },
];