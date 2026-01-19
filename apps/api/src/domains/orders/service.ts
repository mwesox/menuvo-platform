/**
 * Orders Service
 *
 * Service facade for order operations.
 */

import type { Database } from "@menuvo/db";
import {
	items as itemsTable,
	type OrderTypesConfig,
	optionChoices,
	optionGroups,
	orderItemOptions,
	orderItems,
	orders,
	servicePoints,
	storeCounters,
	storeSettings,
	stores,
} from "@menuvo/db/schema";
import {
	and,
	asc,
	count,
	desc,
	eq,
	gte,
	inArray,
	lte,
	sql,
	sum,
} from "drizzle-orm";
import { ForbiddenError, NotFoundError, ValidationError } from "../errors.js";
import type { IVatService } from "../menu/vat/index.js";
import { DEFAULT_ORDER_TYPES } from "../stores/settings/types.js";
import type { IStoreStatusService } from "../stores/status/index.js";
import type { IOrderService } from "./interface.js";
import type {
	CreateOrderInput,
	OrderItemInput,
	OrderStatusType,
} from "./schemas.js";
import {
	orderStatusEnum,
	orderTypeEnum,
	paymentStatusEnum,
} from "./schemas.js";
import type {
	CalculatedOrderItem,
	DateRange,
	DbItem,
	ExportOrder,
	ExportParams,
	OptionChoice,
	OptionGroup,
	OrderStats,
	OrderTotals,
	OrderWithRelations,
} from "./types.js";

/**
 * Orders service implementation
 */
export class OrderService implements IOrderService {
	private readonly db: Database;
	private readonly statusService: IStoreStatusService | null;
	// biome-ignore lint/correctness/noUnusedPrivateClassMembers: Will be used for VAT calculations
	private readonly vatService: IVatService | null;

	constructor(
		db: Database,
		statusService?: IStoreStatusService,
		vatService?: IVatService,
	) {
		this.db = db;
		this.statusService = statusService ?? null;
		this.vatService = vatService ?? null;
	}

	async createOrder(input: CreateOrderInput) {
		// 0. Check for existing order with idempotency key (if provided)
		if (input.idempotencyKey) {
			const existingOrder = await this.db.query.orders.findFirst({
				where: eq(orders.idempotencyKey, input.idempotencyKey),
			});

			if (existingOrder) {
				// Return existing order (matches return type of createOrder)
				return existingOrder;
			}
		}

		// 1. Verify store exists and is active
		const store = await this.db.query.stores.findFirst({
			where: and(eq(stores.id, input.storeId), eq(stores.isActive, true)),
			columns: { id: true, merchantId: true, currency: true, slug: true },
		});

		if (!store) {
			throw new NotFoundError("Store not found or is not active");
		}

		// 1.2. Validate order type is enabled for this store
		const settings = await this.db.query.storeSettings.findFirst({
			where: eq(storeSettings.storeId, input.storeId),
		});

		const orderTypesConfig = settings?.orderTypes ?? DEFAULT_ORDER_TYPES;

		const isOrderTypeEnabled =
			orderTypesConfig[input.orderType as keyof OrderTypesConfig]?.enabled ??
			true;
		if (!isOrderTypeEnabled) {
			throw new ValidationError(
				`Order type "${input.orderType}" is not available for this store.`,
			);
		}

		// 1.5. Validate order based on store status (if status service is available)
		if (this.statusService) {
			const storeStatus = await this.statusService.getStatusBySlug(store.slug);

			// If shop is closed, only takeaway and delivery orders are allowed
			if (
				!storeStatus.isOpen &&
				input.orderType !== "takeaway" &&
				input.orderType !== "delivery"
			) {
				throw new ValidationError(
					"Shop is currently closed. Only takeaway and delivery orders are available for pre-ordering.",
				);
			}

			// If shop is closed, scheduledPickupTime is required for both takeaway and delivery
			if (
				!storeStatus.isOpen &&
				!input.scheduledPickupTime &&
				(input.orderType === "takeaway" || input.orderType === "delivery")
			) {
				throw new ValidationError(
					"Pickup/delivery time is required when shop is closed. Please select a time for when the shop opens.",
				);
			}

			// If shop is closed, scheduledPickupTime must be after nextOpenTime
			if (
				!storeStatus.isOpen &&
				input.scheduledPickupTime &&
				storeStatus.nextOpenTime
			) {
				const nextOpenDate = new Date(storeStatus.nextOpenTime);
				if (input.scheduledPickupTime <= nextOpenDate) {
					throw new ValidationError(
						"Pickup/delivery time must be after the shop opens. Please select a time after the shop opens.",
					);
				}
			}

			// For all takeaway orders, validate scheduledPickupTime
			// For delivery orders when shop is closed, also validate scheduledPickupTime
			if (
				input.orderType === "takeaway" ||
				(input.orderType === "delivery" && !storeStatus.isOpen)
			) {
				if (!input.scheduledPickupTime) {
					const timeLabel =
						input.orderType === "takeaway" ? "Pickup" : "Delivery";
					throw new ValidationError(
						`${timeLabel} time is required for ${input.orderType} orders.`,
					);
				}

				const now = new Date();
				const minAdvanceTime = new Date(now.getTime() + 30 * 60 * 1000); // 30 minutes

				// Validate minimum 30-minute advance time
				if (input.scheduledPickupTime < minAdvanceTime) {
					const timeLabel =
						input.orderType === "takeaway" ? "Pickup" : "Delivery";
					throw new ValidationError(
						`${timeLabel} time must be at least 30 minutes in advance.`,
					);
				}

				// Validate scheduledPickupTime is in the future
				if (input.scheduledPickupTime <= now) {
					const timeLabel =
						input.orderType === "takeaway" ? "Pickup" : "Delivery";
					throw new ValidationError(`${timeLabel} time must be in the future.`);
				}

				// Validate scheduledPickupTime is during open hours
				// Get available slots and check if the selected time is valid
				const availableSlots = await this.statusService.getAvailablePickupSlots(
					store.slug,
				);
				const pickupTimeISO = input.scheduledPickupTime.toISOString();
				const selectedSlot = availableSlots.slots.find(
					(slot) => slot.datetime === pickupTimeISO,
				);

				if (!selectedSlot) {
					const timeLabel =
						input.orderType === "takeaway" ? "pickup" : "delivery";
					throw new ValidationError(
						`Selected ${timeLabel} time is not available. Please select a valid time slot.`,
					);
				}
			}
		}

		// 2. If service point is provided, verify it exists and belongs to the store
		// Note: Validation is done in the router via service points service
		// This is a fallback check for service layer completeness
		if (input.servicePointId) {
			const servicePoint = await this.db.query.servicePoints.findFirst({
				where: and(
					eq(servicePoints.id, input.servicePointId),
					eq(servicePoints.storeId, input.storeId),
					eq(servicePoints.isActive, true),
				),
				columns: { id: true },
			});

			if (!servicePoint) {
				throw new NotFoundError("Service point not found or is not active");
			}
		}

		// 3. Validate and fetch items
		const itemIds = input.items.map((i) => i.itemId);
		const dbItems = await this.validateOrderItems(input.storeId, itemIds);

		// 4. Collect all option choice IDs and fetch them
		const allOptionChoiceIds: string[] = [];
		for (const inputItem of input.items) {
			if (inputItem.options) {
				for (const opt of inputItem.options) {
					allOptionChoiceIds.push(opt.optionChoiceId);
				}
			}
		}

		let choiceMap = new Map<string, OptionChoice>();
		let groupMap = new Map<string, OptionGroup>();

		if (allOptionChoiceIds.length > 0) {
			const dbChoices = await this.db.query.optionChoices.findMany({
				where: inArray(optionChoices.id, allOptionChoiceIds),
				columns: {
					id: true,
					priceModifier: true,
					translations: true,
					optionGroupId: true,
				},
			});

			// Validate all option choices exist
			const foundChoiceIds = new Set(dbChoices.map((c) => c.id));
			for (const choiceId of allOptionChoiceIds) {
				if (!foundChoiceIds.has(choiceId)) {
					throw new NotFoundError(`Option choice ${choiceId} not found`);
				}
			}

			choiceMap = new Map(
				dbChoices.map((c) => [c.id, c as unknown as OptionChoice]),
			);

			// Fetch all referenced option groups
			const groupIds = [...new Set(dbChoices.map((c) => c.optionGroupId))];
			if (groupIds.length > 0) {
				const dbGroups = await this.db.query.optionGroups.findMany({
					where: inArray(optionGroups.id, groupIds),
					columns: { id: true, translations: true },
				});
				groupMap = new Map(
					dbGroups.map((g) => [g.id, g as unknown as OptionGroup]),
				);
			}
		}

		// 5. Calculate totals
		const { subtotal, items: orderItemsData } = this.calculateOrderTotals(
			input.items,
			dbItems as DbItem[],
			choiceMap,
			groupMap,
		);

		// 6. Create the order in a transaction
		const result = await this.db.transaction(async (tx) => {
			// Atomic upsert: insert counter row if missing, increment if exists
			// Counter cycles 0→1→2→...→999→0 (store-scoped sequence)
			const [counter] = await tx
				.insert(storeCounters)
				.values({
					storeId: input.storeId,
					pickupNumber: 1, // First order for this store gets #1
				})
				.onConflictDoUpdate({
					target: storeCounters.storeId,
					set: {
						pickupNumber: sql`(${storeCounters.pickupNumber} + 1) % 1000`,
						updatedAt: new Date(),
					},
				})
				.returning({ pickupNumber: storeCounters.pickupNumber });

			const pickupNumber = counter?.pickupNumber ?? 0;

			// Create the order
			const [newOrder] = await tx
				.insert(orders)
				.values({
					storeId: input.storeId,
					merchantId: store.merchantId,
					servicePointId: input.servicePointId ?? null,
					orderType: input.orderType,
					status: "awaiting_payment",
					paymentStatus: "pending",
					customerName: input.customerName ?? null,
					customerEmail: input.customerEmail ?? null,
					customerPhone: input.customerPhone ?? null,
					customerNotes: input.customerNotes ?? null,
					subtotal,
					taxAmount: 0,
					tipAmount: 0,
					totalAmount: subtotal,
					pickupNumber,
					scheduledPickupTime: input.scheduledPickupTime ?? null,
					idempotencyKey: input.idempotencyKey ?? null,
				})
				.returning();

			if (!newOrder) {
				throw new ValidationError("Failed to create order");
			}

			// Create order items
			for (const itemData of orderItemsData) {
				const [newOrderItem] = await tx
					.insert(orderItems)
					.values({
						orderId: newOrder.id,
						itemId: itemData.itemId,
						name: itemData.name,
						kitchenName: itemData.kitchenName,
						description: itemData.description,
						quantity: itemData.quantity,
						unitPrice: itemData.unitPrice,
						optionsPrice: itemData.optionsPrice,
						totalPrice: itemData.totalPrice,
						displayOrder: itemData.displayOrder,
					})
					.returning();

				if (!newOrderItem) {
					throw new ValidationError("Failed to create order item");
				}

				// Create order item options
				if (itemData.options && itemData.options.length > 0) {
					await tx.insert(orderItemOptions).values(
						itemData.options.map((opt) => ({
							orderItemId: newOrderItem.id,
							optionGroupId: opt.optionGroupId,
							optionChoiceId: opt.optionChoiceId,
							groupName: opt.groupName,
							choiceName: opt.choiceName,
							quantity: opt.quantity,
							priceModifier: opt.priceModifier,
						})),
					);
				}
			}

			return newOrder;
		});

		return result;
	}

	async getById(orderId: string): Promise<OrderWithRelations> {
		const order = await this.db.query.orders.findFirst({
			where: eq(orders.id, orderId),
			with: {
				store: {
					columns: { id: true, name: true, slug: true, currency: true },
				},
				servicePoint: {
					columns: { id: true, name: true, code: true },
				},
				items: {
					with: {
						options: true,
					},
					orderBy: [asc(orderItems.displayOrder)],
				},
			},
		});

		if (!order) {
			throw new NotFoundError("Order not found");
		}

		return order as OrderWithRelations;
	}

	async cancelOrder(orderId: string, merchantId: string, reason?: string) {
		// Verify the order belongs to a store owned by the merchant
		const order = await this.db.query.orders.findFirst({
			where: eq(orders.id, orderId),
			columns: {
				id: true,
				storeId: true,
				status: true,
				paymentStatus: true,
			},
			with: {
				store: {
					columns: { merchantId: true },
				},
			},
		});

		if (!order) {
			throw new NotFoundError("Order not found");
		}

		if (order.store.merchantId !== merchantId) {
			throw new ForbiddenError("You do not have access to this order");
		}

		// Cannot cancel already completed or cancelled orders
		if (order.status === "completed" || order.status === "cancelled") {
			throw new ValidationError(
				`Cannot cancel order with status: ${order.status}`,
			);
		}

		const [cancelledOrder] = await this.db
			.update(orders)
			.set({
				status: "cancelled",
				merchantNotes: reason ? `Cancellation reason: ${reason}` : undefined,
			})
			.where(eq(orders.id, orderId))
			.returning();

		if (!cancelledOrder) {
			throw new ValidationError("Failed to cancel order");
		}

		return cancelledOrder;
	}

	async updateOrderStatus(
		orderId: string,
		merchantId: string,
		newStatus: OrderStatusType,
	) {
		// Verify the order belongs to a store owned by the merchant
		const order = await this.db.query.orders.findFirst({
			where: eq(orders.id, orderId),
			columns: { id: true, storeId: true, status: true },
			with: {
				store: {
					columns: { merchantId: true },
				},
			},
		});

		if (!order) {
			throw new NotFoundError("Order not found");
		}

		if (order.store.merchantId !== merchantId) {
			throw new ForbiddenError("You do not have access to this order");
		}

		// Build update data with timestamps
		const updateData: Record<string, unknown> = {
			status: newStatus,
		};

		// Set timestamps based on status
		if (newStatus === "confirmed" && order.status === "awaiting_payment") {
			updateData.confirmedAt = new Date();
		} else if (newStatus === "completed") {
			updateData.completedAt = new Date();
		}

		const [updatedOrder] = await this.db
			.update(orders)
			.set(updateData)
			.where(eq(orders.id, orderId))
			.returning();

		if (!updatedOrder) {
			throw new ValidationError("Failed to update order status");
		}

		return updatedOrder;
	}

	async getOrderStats(
		storeId: string,
		merchantId: string,
		dateRange?: DateRange,
	): Promise<OrderStats> {
		// Verify the store belongs to the merchant
		const store = await this.db.query.stores.findFirst({
			where: and(eq(stores.id, storeId), eq(stores.merchantId, merchantId)),
			columns: { id: true },
		});

		if (!store) {
			throw new ForbiddenError("You do not have access to this store");
		}

		// Build where conditions
		const conditions = [eq(orders.storeId, storeId)];

		if (dateRange?.startDate) {
			conditions.push(gte(orders.createdAt, dateRange.startDate));
		}

		if (dateRange?.endDate) {
			conditions.push(lte(orders.createdAt, dateRange.endDate));
		}

		// Get total orders and revenue
		const [totals] = await this.db
			.select({
				totalOrders: count(),
				totalRevenue: sum(orders.totalAmount),
			})
			.from(orders)
			.where(and(...conditions));

		const totalOrders = totals?.totalOrders ?? 0;
		const totalRevenue = Number(totals?.totalRevenue ?? 0);
		const averageOrderValue =
			totalOrders > 0 ? Math.round(totalRevenue / totalOrders) : 0;

		// Get orders grouped by status
		const byStatus = await this.db
			.select({
				status: orders.status,
				count: count(),
			})
			.from(orders)
			.where(and(...conditions))
			.groupBy(orders.status);

		const ordersByStatus: Record<string, number> = {};
		for (const row of byStatus) {
			ordersByStatus[row.status] = row.count;
		}

		// Get orders grouped by type
		const byType = await this.db
			.select({
				orderType: orders.orderType,
				count: count(),
			})
			.from(orders)
			.where(and(...conditions))
			.groupBy(orders.orderType);

		const ordersByType: Record<string, number> = {};
		for (const row of byType) {
			ordersByType[row.orderType] = row.count;
		}

		return {
			totalOrders,
			totalRevenue,
			averageOrderValue,
			ordersByStatus,
			ordersByType,
		};
	}

	async getOrdersForExport(params: ExportParams): Promise<ExportOrder[]> {
		const { storeId, merchantId, startDate, endDate, status } = params;

		// Verify the store belongs to the merchant
		const store = await this.db.query.stores.findFirst({
			where: and(eq(stores.id, storeId), eq(stores.merchantId, merchantId)),
			columns: { id: true, currency: true },
		});

		if (!store) {
			throw new ForbiddenError("You do not have access to this store");
		}

		// Build where conditions
		const conditions = [
			eq(orders.storeId, storeId),
			gte(orders.createdAt, startDate),
			lte(orders.createdAt, endDate),
		];

		if (status) {
			conditions.push(eq(orders.status, status));
		}

		const exportOrders = await this.db.query.orders.findMany({
			where: and(...conditions),
			orderBy: [desc(orders.createdAt)],
			with: {
				servicePoint: {
					columns: { name: true, code: true },
				},
				items: {
					with: {
						options: true,
					},
					orderBy: [asc(orderItems.displayOrder)],
				},
			},
		});

		// Transform for export
		return exportOrders.map((order) => ({
			orderId: order.id,
			createdAt: order.createdAt,
			status: orderStatusEnum.parse(order.status),
			paymentStatus: paymentStatusEnum.parse(order.paymentStatus),
			orderType: orderTypeEnum.parse(order.orderType),
			customerName: order.customerName,
			customerEmail: order.customerEmail,
			customerPhone: order.customerPhone,
			servicePoint: order.servicePoint?.name ?? null,
			subtotal: order.subtotal,
			taxAmount: order.taxAmount,
			tipAmount: order.tipAmount,
			totalAmount: order.totalAmount,
			currency: store.currency,
			items: order.items.map((item) => ({
				name: item.name,
				quantity: item.quantity,
				unitPrice: item.unitPrice,
				optionsPrice: item.optionsPrice,
				totalPrice: item.totalPrice,
				options: item.options.map((opt) => ({
					groupName: opt.groupName,
					choiceName: opt.choiceName,
					quantity: opt.quantity,
					priceModifier: opt.priceModifier,
				})),
			})),
		}));
	}

	// Private helper methods
	private async validateOrderItems(
		storeId: string,
		itemIds: string[],
	): Promise<DbItem[]> {
		const dbItems = await this.db.query.items.findMany({
			where: and(
				inArray(itemsTable.id, itemIds),
				eq(itemsTable.storeId, storeId),
				eq(itemsTable.isActive, true),
			),
			columns: {
				id: true,
				price: true,
				kitchenName: true,
				translations: true,
			},
		});

		// Verify all requested items were found
		const foundIds = new Set(dbItems.map((item) => item.id));
		for (const itemId of itemIds) {
			if (!foundIds.has(itemId)) {
				throw new NotFoundError(
					`Item ${itemId} not found, not available, or doesn't belong to this store`,
				);
			}
		}

		return dbItems as DbItem[];
	}

	private calculateOrderTotals(
		inputItems: OrderItemInput[],
		dbItems: DbItem[],
		choiceMap: Map<string, OptionChoice>,
		groupMap: Map<string, OptionGroup>,
	): OrderTotals {
		const dbItemMap = new Map(dbItems.map((item) => [item.id, item]));
		let subtotal = 0;
		const items: CalculatedOrderItem[] = [];

		for (let i = 0; i < inputItems.length; i++) {
			const inputItem = inputItems[i];
			if (!inputItem) continue;

			const dbItem = dbItemMap.get(inputItem.itemId);
			if (!dbItem) continue;

			const itemName = this.extractItemName(dbItem.translations);
			const unitPrice = dbItem.price;

			// Calculate options price
			let optionsPrice = 0;
			const itemOptions: CalculatedOrderItem["options"] = [];

			if (inputItem.options) {
				for (const opt of inputItem.options) {
					const choice = choiceMap.get(opt.optionChoiceId);
					if (!choice) continue;

					const group = groupMap.get(choice.optionGroupId);
					const groupName = this.extractGroupName(group?.translations);
					const choiceName = this.extractChoiceName(choice.translations);

					optionsPrice += choice.priceModifier * (opt.quantity || 1);

					itemOptions.push({
						optionGroupId: choice.optionGroupId,
						optionChoiceId: choice.id,
						groupName,
						choiceName,
						quantity: opt.quantity || 1,
						priceModifier: choice.priceModifier,
					});
				}
			}

			const totalPrice = (unitPrice + optionsPrice) * (inputItem.quantity || 1);
			subtotal += totalPrice;

			items.push({
				name: itemName,
				kitchenName: dbItem.kitchenName ?? null,
				description: null,
				quantity: inputItem.quantity || 1,
				unitPrice,
				optionsPrice,
				totalPrice,
				displayOrder: i,
				itemId: inputItem.itemId,
				specialInstructions: inputItem.specialInstructions,
				options: itemOptions.length > 0 ? itemOptions : undefined,
			});
		}

		return { subtotal, items };
	}

	private extractItemName(translations: unknown): string {
		const trans = translations as { de?: { name?: string } } | undefined;
		return trans?.de?.name || "Unknown Item";
	}

	private extractGroupName(translations: unknown): string {
		const trans = translations as { de?: { name?: string } } | undefined;
		return trans?.de?.name || "Unknown Group";
	}

	private extractChoiceName(translations: unknown): string {
		const trans = translations as { de?: { name?: string } } | undefined;
		return trans?.de?.name || "Unknown Choice";
	}
}
