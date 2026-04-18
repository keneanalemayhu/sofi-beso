// lib/mock-data.ts

import type { Category, OrderWithItems, MenuRow, Waiter  } from "@/types";


// simple stable ids (good enough for UI testing)
export const mockCategories: Category[] = [
  { id: "cat-coffee", name: "Coffee" },
  { id: "cat-breakfast", name: "Breakfast" },
  { id: "cat-lunch", name: "Lunch" },
  { id: "cat-dessert", name: "Dessert" },
  { id: "cat-drinks", name: "Drinks" },
];

export const mockMenu: MenuRow[] = [
  // Coffee
  { id: "m-espresso", category_id: "cat-coffee", name: "Espresso", price: 3.0, is_active: true, category_name: "Coffee" },
  { id: "m-latte", category_id: "cat-coffee", name: "Latte", price: 4.5, is_active: true, category_name: "Coffee" },
  { id: "m-cappuccino", category_id: "cat-coffee", name: "Cappuccino", price: 4.25, is_active: true, category_name: "Coffee" },

  // Breakfast
  { id: "m-omelette", category_id: "cat-breakfast", name: "Cheese Omelette", price: 6.75, is_active: true, category_name: "Breakfast" },
  { id: "m-pancakes", category_id: "cat-breakfast", name: "Pancakes (3)", price: 7.5, is_active: true, category_name: "Breakfast" },
  { id: "m-foul", category_id: "cat-breakfast", name: "Ful Medames", price: 5.0, is_active: true, category_name: "Breakfast" },

  // Lunch
  { id: "m-burger", category_id: "cat-lunch", name: "Classic Burger", price: 9.99, is_active: true, category_name: "Lunch" },
  { id: "m-chicken-wrap", category_id: "cat-lunch", name: "Chicken Wrap", price: 8.5, is_active: true, category_name: "Lunch" },
  { id: "m-fries", category_id: "cat-lunch", name: "French Fries", price: 3.75, is_active: true, category_name: "Lunch" },

  // Dessert
  { id: "m-cheesecake", category_id: "cat-dessert", name: "Cheesecake", price: 5.5, is_active: true, category_name: "Dessert" },
  { id: "m-brownie", category_id: "cat-dessert", name: "Chocolate Brownie", price: 4.75, is_active: true, category_name: "Dessert" },

  // Drinks
  { id: "m-water", category_id: "cat-drinks", name: "Water", price: 1.0, is_active: true, category_name: "Drinks" },
  { id: "m-soda", category_id: "cat-drinks", name: "Soda", price: 1.75, is_active: true, category_name: "Drinks" },
  { id: "m-juice", category_id: "cat-drinks", name: "Fresh Juice", price: 3.25, is_active: true, category_name: "Drinks" },
];

export const mockWaiters: Waiter[] = [
  { id: "w-1", name: "Sami", is_active: true },
  { id: "w-2", name: "Liya", is_active: true },
  { id: "w-3", name: "Dawit", is_active: true },
  { id: "w-4", name: "Hana", is_active: false },
];

export const mockOrders: OrderWithItems[] = [
  {
    order: {
      id: "ord-1",
      order_number: 101,
      waiter_id: "w-1",
      status: "pending",
      created_at: new Date(Date.now() - 1000 * 60 * 8).toISOString(),
      total_amount: 12.5,
      created_by: "",
      waiter_name: ""
    },
    items: [
      {
        id: "oi-1", name: "Latte", quantity: 2, comment: "",
        order_id: "",
        menu_item_id: "",
        price_at_time: ""
      },
      {
        id: "oi-2", name: "Brownie", quantity: 1, comment: "",
        order_id: "",
        menu_item_id: "",
        price_at_time: ""
      },
    ],
  },

  {
    order: {
      id: "ord-2",
      order_number: 102,
      waiter_id: "w-2",
      status: "pending",
      created_at: new Date(Date.now() - 1000 * 60 * 5).toISOString(),
      total_amount: 18.25,
      created_by: "",
      waiter_name: ""
    },
    items: [
      {
        id: "oi-3", name: "Classic Burger", quantity: 1, comment: "No onions",
        order_id: "",
        menu_item_id: "",
        price_at_time: ""
      },
      {
        id: "oi-4", name: "French Fries", quantity: 1, comment: "",
        order_id: "",
        menu_item_id: "",
        price_at_time: ""
      },
      {
        id: "oi-5", name: "Soda", quantity: 2, comment: "",
        order_id: "",
        menu_item_id: "",
        price_at_time: ""
      },
    ],
  },

  {
    order: {
      id: "ord-3",
      order_number: 103,
      waiter_id: "w-1",
      status: "completed",
      created_at: new Date(Date.now() - 1000 * 60 * 3).toISOString(),
      total_amount: 7.5,
      created_by: "",
      waiter_name: ""
    },
    items: [
      {
        id: "oi-6", name: "Pancakes (3)", quantity: 1, comment: "Extra syrup",
        order_id: "",
        menu_item_id: "",
        price_at_time: ""
      },
    ],
  },

  {
    order: {
      id: "ord-4",
      order_number: 104,
      waiter_id: "w-3",
      status: "pending",
      created_at: new Date(Date.now() - 1000 * 60 * 2).toISOString(),
      total_amount: 9.25,
      created_by: "",
      waiter_name: ""
    },
    items: [
      {
        id: "oi-7", name: "Chicken Wrap", quantity: 1, comment: "",
        order_id: "",
        menu_item_id: "",
        price_at_time: ""
      },
      {
        id: "oi-8", name: "Fresh Juice", quantity: 1, comment: "",
        order_id: "",
        menu_item_id: "",
        price_at_time: ""
      },
    ],
  },
];