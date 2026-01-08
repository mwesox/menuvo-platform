// Handler registry

// Account handlers (exports updateMerchantPaymentStatus for direct use if needed)
export {
	type UpdatePaymentStatusInput,
	updateMerchantPaymentStatus,
} from "./account.handler";
export {
	dispatchV1Event,
	dispatchV2Event,
	getRegisteredV1Events,
	getRegisteredV2Events,
	registerV1Handler,
	registerV2Handler,
} from "./registry";

// Note: Handlers self-register when imported via processor.ts
// No need to export handler functions directly
