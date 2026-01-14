/**
 * Hours Domain
 *
 * Exports hours service, router, and types.
 */

export type { IHoursService } from "./interface.js";
export { hoursRouter } from "./router.js";
export type * from "./schemas.js";
export { daysOfWeek, daysOfWeekSchema } from "./schemas.js";
export { HoursService } from "./service.js";
export type * from "./types.js";
