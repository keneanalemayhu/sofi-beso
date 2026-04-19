// @/lib/mock-history.ts

import type { OrderWithItems } from "@/types/order";

const now = new Date();

const minutesAgo = (m: number) =>
  new Date(now.getTime() - m * 60_000).toISOString();

const daysAgo = (d: number, hour = 12, minute = 0) => {
  const date = new Date();
  date.setDate(date.getDate() - d);
  date.setHours(hour, minute, 0, 0);
  return date.toISOString();
};

export const mockCompletedOrdersByDay: OrderWithItems[] = [
  {
    order: {
      id: "h-1",
      order_number: 201,
      waiter_id: "w-1",
      created_by: "cashier",
      status: "completed",
      total_amount: 23.73,
      created_at: minutesAgo(50),
      completed_at: minutesAgo(35),
      waiter_name: "eyerus",
      serving_mode: "individual",
    },
    items: [
      {
        id: "hi-1",
        order_id: "h-1",
        menu_item_id: "m-burger",
        quantity: 2,
        price_at_time: 9.99,
        comment: "No onions",
        name: "Classic Burger",
      },
      {
        id: "hi-2",
        order_id: "h-1",
        menu_item_id: "m-fries",
        quantity: 1,
        price_at_time: 3.75,
        comment: null,
        name: "French Fries",
      },
    ],
  },
  {
    order: {
      id: "h-2",
      order_number: 202,
      waiter_id: "w-2",
      created_by: "cashier",
      status: "completed",
      total_amount: 10.75,
      created_at: minutesAgo(25),
      completed_at: minutesAgo(12),
      waiter_name: "jemal",
      serving_mode: "individual",
    },
    items: [
      {
        id: "hi-3",
        order_id: "h-2",
        menu_item_id: "m-omelette",
        quantity: 1,
        price_at_time: 6.75,
        comment: "Extra cheese",
        name: "Cheese Omelette",
      },
      {
        id: "hi-4",
        order_id: "h-2",
        menu_item_id: "m-water",
        quantity: 1,
        price_at_time: 1,
        comment: null,
        name: "Water",
      },
      {
        id: "hi-5",
        order_id: "h-2",
        menu_item_id: "m-espresso",
        quantity: 1,
        price_at_time: 3,
        comment: null,
        name: "Espresso",
      },
    ],
  },
  {
    order: {
      id: "h-3",
      order_number: 203,
      waiter_id: "w-3",
      created_by: "cashier",
      status: "completed",
      total_amount: 7.5,
      created_at: daysAgo(1, 10, 20),
      completed_at: daysAgo(1, 10, 45),
      waiter_name: "gadise",
      serving_mode: "individual",
    },
    items: [
      {
        id: "hi-6",
        order_id: "h-3",
        menu_item_id: "m-pancakes",
        quantity: 1,
        price_at_time: 7.5,
        comment: "No syrup",
        name: "Pancakes (3)",
      },
    ],
  },
  {
    order: {
      id: "h-4",
      order_number: 204,
      waiter_id: "w-1",
      created_by: "cashier",
      status: "completed",
      total_amount: 12.25,
      created_at: daysAgo(1, 13, 5),
      completed_at: daysAgo(1, 13, 40),
      waiter_name: "eyerus",
      serving_mode: "individual",
    },
    items: [
      {
        id: "hi-7",
        order_id: "h-4",
        menu_item_id: "m-chicken-wrap",
        quantity: 1,
        price_at_time: 8.5,
        comment: null,
        name: "Chicken Wrap",
      },
      {
        id: "hi-8",
        order_id: "h-4",
        menu_item_id: "m-water",
        quantity: 1,
        price_at_time: 1,
        comment: null,
        name: "Water",
      },
      {
        id: "hi-9",
        order_id: "h-4",
        menu_item_id: "m-soda",
        quantity: 1,
        price_at_time: 1.75,
        comment: null,
        name: "Soda",
      },
    ],
  },
  {
    order: {
      id: "h-5",
      order_number: 205,
      waiter_id: "w-2",
      created_by: "cashier",
      status: "completed",
      total_amount: 9.75,
      created_at: daysAgo(2, 9, 0),
      completed_at: daysAgo(2, 9, 25),
      waiter_name: "jemal",
      serving_mode: "individual",
    },
    items: [
      {
        id: "hi-10",
        order_id: "h-5",
        menu_item_id: "m-foul",
        quantity: 1,
        price_at_time: 5,
        comment: null,
        name: "Ful Medames",
      },
      {
        id: "hi-11",
        order_id: "h-5",
        menu_item_id: "m-juice",
        quantity: 1,
        price_at_time: 3.25,
        comment: null,
        name: "Fresh Juice",
      },
      {
        id: "hi-12",
        order_id: "h-5",
        menu_item_id: "m-water",
        quantity: 1,
        price_at_time: 1.5,
        comment: null,
        name: "Water",
      },
    ],
  },
];