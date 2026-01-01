/**
 * Layout constants for the shop feature.
 */

/** Height of the main header in pixels */
export const HEADER_HEIGHT = 56;

/** Height of the category navigation bar in pixels */
export const CATEGORY_NAV_HEIGHT = 48;

/** Combined header offset for scroll calculations */
export const HEADER_OFFSET = HEADER_HEIGHT + CATEGORY_NAV_HEIGHT;

/** Intersection observer root margin for category scroll tracking */
export const CATEGORY_INTERSECTION_ROOT_MARGIN = "-120px 0px -70% 0px";

/** localStorage key for service point tracking */
export const SERVICE_POINT_STORAGE_KEY = "menuvo_service_point";
