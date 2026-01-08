// Handler registry
export {
	dispatchMollieEvent,
	getRegisteredMollieEvents,
	type MollieEventType,
	type MollieHandler,
	registerMollieHandler,
} from "./registry";

// Import handlers to trigger self-registration
// These handlers register themselves when imported
import "./payment.handler";
import "./refund.handler";
import "./subscription.handler";
