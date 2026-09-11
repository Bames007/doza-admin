// config/navigation.ts

import { getAdminNavigation, adminNavigation } from "./admin-navigation";
import type { NavigationItem, UserRole } from "./type";
import logger from "@/app/utils/logger";

export const getFilteredNavigation = (
  userRole: UserRole | string,
): NavigationItem[] => {
  const roleLower = userRole.toLowerCase() as UserRole;
  const items = getAdminNavigation(roleLower);
  if (items.length > 0) {
    logger.debug({ userRole }, "Returning admin navigation");
    return items;
  }
  logger.warn({ userRole }, "Unknown admin role – returning empty navigation");
  return [];
};

// Re-export admin config for convenience
export { adminNavigation };
