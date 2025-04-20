import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

// Colors for different risk levels - matching BuildingDataModal
const RISK_COLORS = {
  HIGH: "#EF4444",    // Red - High risk
  MEDIUM: "#F59E0B",  // Amber - Medium risk
  LOW: "#10B981"      // Green - Low risk
};

export function cn(...inputs: ClassValue[]) {
    return twMerge(clsx(inputs));
}

// Determine color based on safety score
export const getScoreColor = (score: number) => {
    if (score >= 90) return RISK_COLORS.HIGH; // Red for high risk
    if (score >= 70) return RISK_COLORS.MEDIUM; // Amber for medium risk
    return RISK_COLORS.LOW; // Green for low risk
};
