/**
 * Core types and interfaces for the API
 * This file contains shared type definitions used across the application
 */

// Generic API response wrapper
export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

// Pagination parameters
export interface PaginationParams {
  page?: number;
  limit?: number;
}

// Paginated response wrapper
export interface PaginatedResponse<T> {
  items: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

// Health check response
export interface HealthResponse {
  status: "ok" | "error";
  timestamp: string;
  uptime: number;
  version: string;
}

// Error response structure
export interface ErrorResponse {
  error: string;
  message?: string;
  details?: string[];
}
