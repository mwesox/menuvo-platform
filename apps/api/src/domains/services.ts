/**
 * Domain Services Aggregator
 *
 * Aggregates all domains services and handles dependency injection.
 * This is the single entry point for accessing domains services.
 */

import type { Database } from "@menuvo/db";
import { AuthService, type IAuthService } from "./auth/index.js";
import { type IImagesService, ImagesService } from "./images/index.js";
import {
	CategoriesService,
	type ICategoriesService,
} from "./menu/categories/index.js";
import {
	type IMenuImportService,
	MenuImportService,
} from "./menu/import/index.js";
import { type IItemsService, ItemsService } from "./menu/items/index.js";
import { type IShopMenuService, ShopMenuService } from "./menu/shop/index.js";
import { type IMerchantsService, MerchantsService } from "./merchants/index.js";
import {
	type IOnboardingService,
	OnboardingService,
} from "./onboarding/index.js";
import { type IOrderService, OrderService } from "./orders/index.js";
import { type IPaymentService, PaymentService } from "./payments/index.js";
import {
	ClosuresService,
	type IClosuresService,
} from "./stores/closures/index.js";
import { HoursService, type IHoursService } from "./stores/hours/index.js";
import { type IStoreService, StoreService } from "./stores/index.js";
import {
	type IServicePointsService,
	ServicePointsService,
} from "./stores/service-points/index.js";
import {
	type IStoreSettingsService,
	StoreSettingsService,
} from "./stores/settings/index.js";
import {
	type IStoreStatusService,
	StoreStatusService,
} from "./stores/status/index.js";

/**
 * Dependencies required for DomainServices.
 */
export interface DomainServicesDeps {
	db: Database;
}

/**
 * Domain services aggregator.
 *
 * Provides access to all domains services through a single instance.
 * Services are instantiated once and reused across requests.
 */
export class DomainServices {
	readonly auth: IAuthService;
	readonly categories: ICategoriesService;
	readonly closures: IClosuresService;
	readonly hours: IHoursService;
	readonly images: IImagesService;
	readonly items: IItemsService;
	readonly menuImport: IMenuImportService;
	readonly merchants: IMerchantsService;
	readonly onboarding: IOnboardingService;
	readonly orders: IOrderService;
	readonly payments: IPaymentService;
	readonly servicePoints: IServicePointsService;
	readonly shopMenu: IShopMenuService;
	readonly status: IStoreStatusService;
	readonly storeSettings: IStoreSettingsService;
	readonly stores: IStoreService;

	constructor(deps: DomainServicesDeps) {
		this.auth = new AuthService(deps.db);
		this.categories = new CategoriesService(deps.db);
		this.closures = new ClosuresService(deps.db);
		this.hours = new HoursService(deps.db);
		this.images = new ImagesService(deps.db);
		this.items = new ItemsService(deps.db);
		this.menuImport = new MenuImportService(deps.db);
		this.merchants = new MerchantsService(deps.db);
		this.payments = new PaymentService(deps.db);
		this.servicePoints = new ServicePointsService(deps.db);
		this.shopMenu = new ShopMenuService(deps.db);
		this.status = new StoreStatusService(deps.db);
		this.storeSettings = new StoreSettingsService(deps.db);
		this.orders = new OrderService(deps.db, this.status);
		this.stores = new StoreService(deps.db, this.status);
		// Onboarding depends on merchants and stores services
		this.onboarding = new OnboardingService(
			deps.db,
			this.merchants,
			this.stores,
		);
	}
}

// Re-export service interfaces for type usage
export type { IAuthService } from "./auth/index.js";
export type { IImagesService } from "./images/index.js";
export type { ICategoriesService } from "./menu/categories/index.js";
export type { IMenuImportService } from "./menu/import/index.js";
export type { IItemsService } from "./menu/items/index.js";
export type { IShopMenuService } from "./menu/shop/index.js";
export type { IMerchantsService } from "./merchants/index.js";
export type { IOnboardingService } from "./onboarding/index.js";
export type { IOrderService } from "./orders/index.js";
export type { IPaymentService } from "./payments/index.js";
export type { IClosuresService } from "./stores/closures/index.js";
export type { IHoursService } from "./stores/hours/index.js";
export type { IStoreService } from "./stores/index.js";
export type { IServicePointsService } from "./stores/service-points/index.js";
export type { IStoreSettingsService } from "./stores/settings/index.js";
export type { IStoreStatusService } from "./stores/status/index.js";
