/**
 * Currency formatting utilities for Indian Rupees (INR)
 */

export const formatPrice = (price: number): string => {
  return `₹${price.toFixed(0)}`;
};

export const formatPriceWithDecimals = (price: number): string => {
  return `₹${price.toFixed(2)}`;
};

// Price range display (e.g., "₹300 for two")
export const formatPriceForTwo = (price: number): string => {
  return `₹${price} for two`;
};
