import { PricingMode, PricingUnit, StationType } from "@/types/database";

export interface SessionCostInput {
  station_type: StationType;
  mode: PricingMode;
  unit: PricingUnit;
  rate: number;
  start_time: string;
  end_time: string | null;
  games_count: number | null;
  sale_items_total: number;
}

export interface SessionCostOutput {
  duration_hours: number;
  session_cost: number;
  products_cost: number;
  total_cost: number;
}

/**
 * Calculate session cost based on server time and pricing rules
 * 
 * Formula: duration_hours * rate
 * - duration_hours is calculated with fractional minutes (no rounding)
 * - rate is the hourly/game rate from pricing_rules
 * - When unit = 'game', cost = games_count * rate
 * - When unit = 'hour', cost = duration_hours * rate
 */
export function calculateSessionCost(input: SessionCostInput): SessionCostOutput {
  const { unit, rate, start_time, end_time, games_count, sale_items_total } = input;

  let duration_hours = 0;
  let session_cost = 0;

  if (unit === 'game') {
    const games = games_count || 0;
    session_cost = games * rate;
    duration_hours = 0;
  } else {
    // Cost based on duration
    const startTime = new Date(start_time);
    const endTime = end_time ? new Date(end_time) : new Date();
    
    // Calculate duration in hours with fractional minutes
    const durationMs = endTime.getTime() - startTime.getTime();
    duration_hours = durationMs / (1000 * 60 * 60); // Convert to hours
    
    // Cost = duration_hours * rate (no rounding, exact calculation)
    session_cost = duration_hours * rate;
  }

  const total_cost = session_cost + sale_items_total;

  return {
    duration_hours,
    session_cost,
    products_cost: sale_items_total,
    total_cost,
  };
}

/**
 * Format duration for display (e.g., "1h 30m", "45m", "2h")
 */
export function formatDuration(durationHours: number): string {
  const hours = Math.floor(durationHours);
  const minutes = Math.round((durationHours - hours) * 60);

  if (hours > 0 && minutes > 0) {
    return `${hours}س ${minutes}د`;
  } else if (hours > 0) {
    return `${hours}س`;
  } else if (minutes > 0) {
    return `${minutes}د`;
  } else {
    return '0د';
  }
}
