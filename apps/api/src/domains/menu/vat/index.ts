/**
 * VAT Domain
 *
 * VAT (Mehrwertsteuer) management for menu items.
 */

// Calculator functions
export {
	calculateItemVat,
	calculateOrderVat,
	calculateVatFromGross,
	formatVatRate,
} from "./calculator.js";
// Interface
export type {
	CreateVatGroupInput as CreateVatGroupServiceInput,
	IVatService,
	UpdateVatGroupInput as UpdateVatGroupServiceInput,
} from "./interface.js";

// Router
export { type VatRouter, vatRouter } from "./router.js";
// Schemas
export {
	type CreateVatGroupInput,
	createVatGroupSchema,
	type DeleteVatGroupInput,
	deleteVatGroupSchema,
	type GetVatGroupInput,
	getVatGroupSchema,
	type UpdateVatGroupInput,
	updateVatGroupSchema,
} from "./schemas.js";
// Service
export { VatService } from "./service.js";
// Types
export type {
	CalculatedItemVat,
	ItemWithVatInfo,
	OptionChoiceWithVatInfo,
	VatCalculationResult,
	VatComponents,
	VatGroupWithRate,
	VatLineAggregate,
} from "./types.js";
