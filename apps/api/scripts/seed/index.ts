/**
 * Seed Data and Runner Module
 *
 * Contains all seed data and orchestrates seeding in dependency order.
 * Includes idempotency checks to skip existing entities.
 */

import type { DomainServices } from "../../src/domains/services.js";
import type { CreateMerchantInput } from "../../src/domains/merchants/types.js";
import type { CreateStoreInput } from "../../src/domains/stores/types.js";
import type { CreateVatGroupInput } from "../../src/domains/menu/vat/interface.js";
import type { CreateCategoryInput } from "../../src/domains/menu/categories/types.js";
import type { CreateItemInput } from "../../src/domains/menu/items/types.js";
import type { SaveHoursInput, StoreHourInput } from "../../src/domains/stores/hours/types.js";
import type { OrderTypesConfig } from "@menuvo/db/schema";

// ============================================================================
// SEED DATA TYPES
// ============================================================================

interface MerchantSeedData extends CreateMerchantInput {
	vatGroups: VatGroupSeedData[];
	stores: StoreSeedData[];
}

interface StoreSeedData extends Omit<CreateStoreInput, "slug"> {
	slug: string;
	optionGroups: OptionGroupSeedData[];
	categories: CategorySeedData[];
	hours: StoreHourInput[];
	orderTypes: OrderTypesConfig;
	servicePoints: ServicePointSeedData;
}

interface OptionGroupSeedData {
	code: string; // For referencing in items
	translations: Record<string, { name: string; description?: string }>;
	type: "single_select" | "multi_select" | "quantity_select";
	minSelections: number;
	maxSelections: number | null;
	isRequired: boolean;
	choices: OptionChoiceSeedData[];
}

interface OptionChoiceSeedData {
	translations: Record<string, { name: string }>;
	priceModifier: number; // In cents
	isDefault?: boolean;
}

interface VatGroupSeedData extends CreateVatGroupInput {}

interface CategorySeedData {
	translations: Record<string, { name: string; description?: string }>;
	vatGroupCode?: string; // Reference to VAT group by code
	items: ItemSeedData[];
}

interface ItemSeedData {
	translations: Record<string, { name: string; description?: string }>;
	price: number; // In cents
	allergens?: string[];
	kitchenName?: string;
	optionGroupCodes?: string[]; // References to option groups by code
}

interface ServicePointSeedData {
	prefix: string;
	startNumber: number;
	count: number;
	zone?: string;
}

// ============================================================================
// SEED DATA
// ============================================================================

const MERCHANTS: MerchantSeedData[] = [
	{
		name: "Gasthof Müller GmbH",
		ownerName: "Hans Müller",
		email: "hans@gasthof-mueller.test",
		phone: "+49 89 1234567",
		supportedLanguages: ["de", "en"],
		vatGroups: [
			{ code: "standard", name: "Standard", description: "Standard VAT rate", rate: 1900 },
			{ code: "food", name: "Ermäßigt (Speisen)", description: "Reduced VAT for food", rate: 700 },
		],
		stores: [
			{
				name: "Gasthof Müller - Hauptfiliale",
				slug: "gasthof-mueller-hauptfiliale",
				street: "Marienplatz 1",
				city: "München",
				postalCode: "80331",
				country: "DE",
				phone: "+49 89 1234567",
				email: "hauptfiliale@gasthof-mueller.test",
				timezone: "Europe/Berlin",
				currency: "EUR",
				optionGroups: [
					{
						code: "bier-groesse",
						translations: {
							de: { name: "Größe", description: "Wählen Sie die Größe" },
							en: { name: "Size", description: "Choose your size" },
						},
						type: "single_select",
						minSelections: 1,
						maxSelections: 1,
						isRequired: true,
						choices: [
							{ translations: { de: { name: "0,3l" }, en: { name: "0.3l" } }, priceModifier: -100, isDefault: false },
							{ translations: { de: { name: "0,5l" }, en: { name: "0.5l" } }, priceModifier: 0, isDefault: true },
							{ translations: { de: { name: "1,0l (Maß)" }, en: { name: "1.0l (Maß)" } }, priceModifier: 490, isDefault: false },
						],
					},
					{
						code: "extras",
						translations: {
							de: { name: "Extras", description: "Zusätzliche Beilagen" },
							en: { name: "Extras", description: "Additional sides" },
						},
						type: "multi_select",
						minSelections: 0,
						maxSelections: 3,
						isRequired: false,
						choices: [
							{ translations: { de: { name: "Extra Knödel" }, en: { name: "Extra Dumpling" } }, priceModifier: 350 },
							{ translations: { de: { name: "Extra Sauerkraut" }, en: { name: "Extra Sauerkraut" } }, priceModifier: 200 },
							{ translations: { de: { name: "Extra Soße" }, en: { name: "Extra Sauce" } }, priceModifier: 150 },
						],
					},
					{
						code: "schnitzel-art",
						translations: {
							de: { name: "Schnitzel Art", description: "Wählen Sie Ihr Schnitzel" },
							en: { name: "Schnitzel Type", description: "Choose your schnitzel" },
						},
						type: "single_select",
						minSelections: 1,
						maxSelections: 1,
						isRequired: true,
						choices: [
							{ translations: { de: { name: "Wiener Art (Kalb)" }, en: { name: "Viennese Style (Veal)" } }, priceModifier: 0, isDefault: true },
							{ translations: { de: { name: "Schweineschnitzel" }, en: { name: "Pork Schnitzel" } }, priceModifier: -400 },
							{ translations: { de: { name: "Hähnchenschnitzel" }, en: { name: "Chicken Schnitzel" } }, priceModifier: -300 },
						],
					},
				],
				categories: [
					{
						translations: {
							de: { name: "Vorspeisen", description: "Unsere hausgemachten Vorspeisen" },
							en: { name: "Starters", description: "Our homemade starters" },
						},
						vatGroupCode: "food",
						items: [
							{
								translations: {
									de: { name: "Bayerische Leberknödelsuppe", description: "Klare Rinderbrühe mit hausgemachten Leberknödeln" },
									en: { name: "Bavarian Liver Dumpling Soup", description: "Clear beef broth with homemade liver dumplings" },
								},
								price: 790,
								kitchenName: "Leberknödel",
							},
							{
								translations: {
									de: { name: "Obatzda mit Breze", description: "Würziger Camembert-Aufstrich mit frischer Breze" },
									en: { name: "Obatzda with Pretzel", description: "Spicy Camembert spread with fresh pretzel" },
								},
								price: 890,
								allergens: ["gluten", "dairy"],
								kitchenName: "Obatzda",
							},
							{
								translations: {
									de: { name: "Wurstsalat", description: "Bayerischer Wurstsalat mit Zwiebeln und Essig-Öl" },
									en: { name: "Sausage Salad", description: "Bavarian sausage salad with onions and vinaigrette" },
								},
								price: 1090,
								kitchenName: "Wurstsalat",
							},
						],
					},
					{
						translations: {
							de: { name: "Hauptgerichte", description: "Deftige bayerische Küche" },
							en: { name: "Main Courses", description: "Hearty Bavarian cuisine" },
						},
						vatGroupCode: "food",
						items: [
							{
								translations: {
									de: { name: "Schweinshaxe", description: "Knusprige Schweinshaxe mit Sauerkraut und Knödel" },
									en: { name: "Pork Knuckle", description: "Crispy pork knuckle with sauerkraut and dumpling" },
								},
								price: 1890,
								kitchenName: "Haxe",
								optionGroupCodes: ["extras"],
							},
							{
								translations: {
									de: { name: "Wiener Schnitzel", description: "Vom Kalb, mit Kartoffelsalat und Preiselbeeren" },
									en: { name: "Wiener Schnitzel", description: "Veal cutlet with potato salad and lingonberries" },
								},
								price: 2290,
								allergens: ["gluten", "eggs"],
								kitchenName: "Schnitzel",
								optionGroupCodes: ["schnitzel-art", "extras"],
							},
							{
								translations: {
									de: { name: "Kässpatzen", description: "Hausgemachte Spätzle mit Bergkäse überbacken" },
									en: { name: "Cheese Spaetzle", description: "Homemade spaetzle baked with mountain cheese" },
								},
								price: 1490,
								allergens: ["gluten", "eggs", "dairy"],
								kitchenName: "Kässpatzen",
							},
							{
								translations: {
									de: { name: "Sauerbraten", description: "Geschmorter Rinderbraten mit Kartoffelklößen" },
									en: { name: "Sauerbraten", description: "Braised beef roast with potato dumplings" },
								},
								price: 1990,
								kitchenName: "Sauerbraten",
							},
						],
					},
					{
						translations: {
							de: { name: "Desserts", description: "Süße Versuchungen" },
							en: { name: "Desserts", description: "Sweet temptations" },
						},
						vatGroupCode: "food",
						items: [
							{
								translations: {
									de: { name: "Kaiserschmarrn", description: "Mit Puderzucker und Apfelmus" },
									en: { name: "Kaiserschmarrn", description: "With powdered sugar and apple sauce" },
								},
								price: 990,
								allergens: ["gluten", "eggs", "dairy"],
								kitchenName: "Kaiserschmarrn",
							},
							{
								translations: {
									de: { name: "Apfelstrudel", description: "Warmer Apfelstrudel mit Vanillesoße" },
									en: { name: "Apple Strudel", description: "Warm apple strudel with vanilla sauce" },
								},
								price: 790,
								allergens: ["gluten", "dairy"],
								kitchenName: "Strudel",
							},
							{
								translations: {
									de: { name: "Bayerische Creme", description: "Klassische Vanille-Creme mit Früchten" },
									en: { name: "Bavarian Cream", description: "Classic vanilla cream with fruits" },
								},
								price: 690,
								allergens: ["dairy", "eggs"],
								kitchenName: "Bay.Creme",
							},
						],
					},
					{
						translations: {
							de: { name: "Getränke", description: "Kühle und warme Getränke" },
							en: { name: "Beverages", description: "Cold and hot drinks" },
						},
						vatGroupCode: "standard",
						items: [
							{
								translations: {
									de: { name: "Augustiner Helles", description: "Frisch vom Fass" },
									en: { name: "Augustiner Lager", description: "Fresh from the tap" },
								},
								price: 490,
								kitchenName: "Augustiner",
								optionGroupCodes: ["bier-groesse"],
							},
							{
								translations: {
									de: { name: "Paulaner Weißbier", description: "Naturtrüb" },
									en: { name: "Paulaner Wheat Beer", description: "Unfiltered" },
								},
								price: 520,
								allergens: ["gluten"],
								kitchenName: "Weißbier",
								optionGroupCodes: ["bier-groesse"],
							},
							{
								translations: {
									de: { name: "Apfelschorle (0,4l)", description: "Apfelsaft mit Mineralwasser" },
									en: { name: "Apple Spritzer (0.4l)", description: "Apple juice with sparkling water" },
								},
								price: 390,
								kitchenName: "Apfelschorle",
							},
							{
								translations: {
									de: { name: "Kaffee", description: "Frisch gebrüht" },
									en: { name: "Coffee", description: "Freshly brewed" },
								},
								price: 350,
								kitchenName: "Kaffee",
							},
						],
					},
				],
				hours: [
					// Monday
					{ dayOfWeek: 1, openTime: "11:00", closeTime: "14:30", displayOrder: 0 },
					{ dayOfWeek: 1, openTime: "17:00", closeTime: "22:00", displayOrder: 1 },
					// Tuesday
					{ dayOfWeek: 2, openTime: "11:00", closeTime: "14:30", displayOrder: 0 },
					{ dayOfWeek: 2, openTime: "17:00", closeTime: "22:00", displayOrder: 1 },
					// Wednesday
					{ dayOfWeek: 3, openTime: "11:00", closeTime: "14:30", displayOrder: 0 },
					{ dayOfWeek: 3, openTime: "17:00", closeTime: "22:00", displayOrder: 1 },
					// Thursday
					{ dayOfWeek: 4, openTime: "11:00", closeTime: "14:30", displayOrder: 0 },
					{ dayOfWeek: 4, openTime: "17:00", closeTime: "22:00", displayOrder: 1 },
					// Friday
					{ dayOfWeek: 5, openTime: "11:00", closeTime: "14:30", displayOrder: 0 },
					{ dayOfWeek: 5, openTime: "17:00", closeTime: "23:00", displayOrder: 1 },
					// Saturday
					{ dayOfWeek: 6, openTime: "11:00", closeTime: "23:00", displayOrder: 0 },
					// Sunday
					{ dayOfWeek: 0, openTime: "11:00", closeTime: "21:00", displayOrder: 0 },
				],
				orderTypes: {
					dine_in: { enabled: true, displayOrder: 0 },
					takeaway: { enabled: true, displayOrder: 1 },
					delivery: { enabled: false, displayOrder: 2 },
				},
				servicePoints: { prefix: "Tisch", startNumber: 1, count: 10, zone: "Gastraum" },
			},
			{
				name: "Gasthof Müller - Schwabing",
				slug: "gasthof-mueller-schwabing",
				street: "Leopoldstraße 45",
				city: "München",
				postalCode: "80802",
				country: "DE",
				phone: "+49 89 9876543",
				email: "schwabing@gasthof-mueller.test",
				timezone: "Europe/Berlin",
				currency: "EUR",
				optionGroups: [], // No option groups for this store
				categories: [
					{
						translations: {
							de: { name: "Vorspeisen", description: "Frische Vorspeisen" },
							en: { name: "Starters", description: "Fresh starters" },
						},
						vatGroupCode: "food",
						items: [
							{
								translations: {
									de: { name: "Münchner Weißwurst", description: "2 Weißwürste mit süßem Senf und Breze" },
									en: { name: "Munich White Sausage", description: "2 white sausages with sweet mustard and pretzel" },
								},
								price: 890,
								allergens: ["gluten"],
								kitchenName: "Weißwurst",
							},
							{
								translations: {
									de: { name: "Kartoffelsuppe", description: "Cremige Kartoffelsuppe mit Croutons" },
									en: { name: "Potato Soup", description: "Creamy potato soup with croutons" },
								},
								price: 690,
								allergens: ["gluten", "dairy"],
								kitchenName: "Kartoffelsuppe",
							},
						],
					},
					{
						translations: {
							de: { name: "Hauptgerichte", description: "Herzhafte Gerichte" },
							en: { name: "Main Courses", description: "Hearty dishes" },
						},
						vatGroupCode: "food",
						items: [
							{
								translations: {
									de: { name: "Leberkäse mit Spiegelei", description: "Hausgemacht mit Kartoffelsalat" },
									en: { name: "Meatloaf with Fried Egg", description: "Homemade with potato salad" },
								},
								price: 1290,
								allergens: ["eggs"],
								kitchenName: "LKS",
							},
							{
								translations: {
									de: { name: "Hendl (halbes)", description: "Knuspriges Brathendl mit Kartoffelsalat" },
									en: { name: "Roast Chicken (half)", description: "Crispy roast chicken with potato salad" },
								},
								price: 1490,
								kitchenName: "1/2 Hendl",
							},
							{
								translations: {
									de: { name: "Schweinebraten", description: "Mit Knödel und Krautsalat" },
									en: { name: "Pork Roast", description: "With dumpling and coleslaw" },
								},
								price: 1590,
								kitchenName: "Schweinebraten",
							},
						],
					},
					{
						translations: {
							de: { name: "Desserts", description: "Hausgemachte Nachspeisen" },
							en: { name: "Desserts", description: "Homemade desserts" },
						},
						vatGroupCode: "food",
						items: [
							{
								translations: {
									de: { name: "Dampfnudel", description: "Mit Vanillesoße" },
									en: { name: "Steamed Dumpling", description: "With vanilla sauce" },
								},
								price: 790,
								allergens: ["gluten", "eggs", "dairy"],
								kitchenName: "Dampfnudel",
							},
						],
					},
					{
						translations: {
							de: { name: "Getränke", description: "Erfrischungen" },
							en: { name: "Beverages", description: "Refreshments" },
						},
						vatGroupCode: "standard",
						items: [
							{
								translations: {
									de: { name: "Spaten Helles (0,5l)", description: "Münchner Bier vom Fass" },
									en: { name: "Spaten Lager (0.5l)", description: "Munich beer from tap" },
								},
								price: 480,
								kitchenName: "Spaten 0,5",
							},
							{
								translations: {
									de: { name: "Spezi (0,4l)", description: "Cola-Orange Mix" },
									en: { name: "Spezi (0.4l)", description: "Cola-Orange mix" },
								},
								price: 380,
								kitchenName: "Spezi",
							},
						],
					},
				],
				hours: [
					// Tuesday - Sunday (closed Monday)
					{ dayOfWeek: 2, openTime: "11:30", closeTime: "22:00", displayOrder: 0 },
					{ dayOfWeek: 3, openTime: "11:30", closeTime: "22:00", displayOrder: 0 },
					{ dayOfWeek: 4, openTime: "11:30", closeTime: "22:00", displayOrder: 0 },
					{ dayOfWeek: 5, openTime: "11:30", closeTime: "23:00", displayOrder: 0 },
					{ dayOfWeek: 6, openTime: "10:00", closeTime: "23:00", displayOrder: 0 },
					{ dayOfWeek: 0, openTime: "10:00", closeTime: "21:00", displayOrder: 0 },
				],
				orderTypes: {
					dine_in: { enabled: true, displayOrder: 0 },
					takeaway: { enabled: true, displayOrder: 1 },
					delivery: { enabled: false, displayOrder: 2 },
				},
				servicePoints: { prefix: "Tisch", startNumber: 1, count: 8, zone: "Gastraum" },
			},
		],
	},
	{
		name: "Cafe Sonnenschein UG",
		ownerName: "Lisa Schmidt",
		email: "lisa@cafe-sonnenschein.test",
		phone: "+49 30 5551234",
		supportedLanguages: ["de", "en"],
		vatGroups: [
			{ code: "standard", name: "Standard", description: "Standard VAT rate", rate: 1900 },
			{ code: "food", name: "Ermäßigt (Speisen)", description: "Reduced VAT for food", rate: 700 },
		],
		stores: [
			{
				name: "Cafe Sonnenschein",
				slug: "cafe-sonnenschein",
				street: "Prenzlauer Allee 123",
				city: "Berlin",
				postalCode: "10405",
				country: "DE",
				phone: "+49 30 5551234",
				email: "kontakt@cafe-sonnenschein.test",
				timezone: "Europe/Berlin",
				currency: "EUR",
				optionGroups: [
					{
						code: "milch-art",
						translations: {
							de: { name: "Milch", description: "Wählen Sie Ihre Milch" },
							en: { name: "Milk", description: "Choose your dairy" },
						},
						type: "single_select",
						minSelections: 1,
						maxSelections: 1,
						isRequired: true,
						choices: [
							{ translations: { de: { name: "Kuhmilch" }, en: { name: "Cow's Milk" } }, priceModifier: 0, isDefault: true },
							{ translations: { de: { name: "Hafermilch" }, en: { name: "Oat Milk" } }, priceModifier: 60 },
							{ translations: { de: { name: "Sojamilch" }, en: { name: "Soy Milk" } }, priceModifier: 60 },
							{ translations: { de: { name: "Mandelmilch" }, en: { name: "Almond Milk" } }, priceModifier: 80 },
						],
					},
					{
						code: "kaffee-extras",
						translations: {
							de: { name: "Extras", description: "Zusätze für Ihren Kaffee" },
							en: { name: "Extras", description: "Add-ons for your coffee" },
						},
						type: "multi_select",
						minSelections: 0,
						maxSelections: 3,
						isRequired: false,
						choices: [
							{ translations: { de: { name: "Extra Shot" }, en: { name: "Extra Shot" } }, priceModifier: 80 },
							{ translations: { de: { name: "Vanillesirup" }, en: { name: "Vanilla Syrup" } }, priceModifier: 50 },
							{ translations: { de: { name: "Karamellsirup" }, en: { name: "Caramel Syrup" } }, priceModifier: 50 },
						],
					},
				],
				categories: [
					{
						translations: {
							de: { name: "Frühstück", description: "Starte gut in den Tag" },
							en: { name: "Breakfast", description: "Start your day right" },
						},
						vatGroupCode: "food",
						items: [
							{
								translations: {
									de: { name: "Berliner Frühstück", description: "Schrippe, Butter, Marmelade, Käse, Schinken, Ei" },
									en: { name: "Berlin Breakfast", description: "Roll, butter, jam, cheese, ham, egg" },
								},
								price: 1190,
								allergens: ["gluten", "eggs", "dairy"],
								kitchenName: "Berl.Frühst.",
							},
							{
								translations: {
									de: { name: "Avocado Toast", description: "Auf Sauerteigbrot mit pochiertem Ei" },
									en: { name: "Avocado Toast", description: "On sourdough with poached egg" },
								},
								price: 1290,
								allergens: ["gluten", "eggs"],
								kitchenName: "Avo Toast",
							},
							{
								translations: {
									de: { name: "Granola Bowl", description: "Mit Joghurt, frischen Beeren und Honig" },
									en: { name: "Granola Bowl", description: "With yogurt, fresh berries and honey" },
								},
								price: 890,
								allergens: ["dairy", "nuts"],
								kitchenName: "Granola",
							},
						],
					},
					{
						translations: {
							de: { name: "Mittagskarte", description: "Leichte Gerichte für die Mittagspause" },
							en: { name: "Lunch Menu", description: "Light dishes for your lunch break" },
						},
						vatGroupCode: "food",
						items: [
							{
								translations: {
									de: { name: "Buddha Bowl", description: "Quinoa, Gemüse, Hummus und Tahini-Dressing" },
									en: { name: "Buddha Bowl", description: "Quinoa, vegetables, hummus and tahini dressing" },
								},
								price: 1390,
								allergens: ["sesame"],
								kitchenName: "Buddha",
							},
							{
								translations: {
									de: { name: "Club Sandwich", description: "Mit Hähnchen, Bacon, Salat und Pommes" },
									en: { name: "Club Sandwich", description: "With chicken, bacon, salad and fries" },
								},
								price: 1490,
								allergens: ["gluten", "eggs"],
								kitchenName: "Club",
							},
							{
								translations: {
									de: { name: "Tagessuppe", description: "Frag nach unserer aktuellen Suppe" },
									en: { name: "Soup of the Day", description: "Ask about our current soup" },
								},
								price: 690,
								kitchenName: "Suppe",
							},
						],
					},
					{
						translations: {
							de: { name: "Kuchen & Gebäck", description: "Hausgemacht und täglich frisch" },
							en: { name: "Cakes & Pastries", description: "Homemade and fresh daily" },
						},
						vatGroupCode: "food",
						items: [
							{
								translations: {
									de: { name: "Käsekuchen", description: "Nach Omas Rezept" },
									en: { name: "Cheesecake", description: "Grandma's recipe" },
								},
								price: 490,
								allergens: ["gluten", "eggs", "dairy"],
								kitchenName: "Käsekuchen",
							},
							{
								translations: {
									de: { name: "Croissant", description: "Frisch aus dem Ofen" },
									en: { name: "Croissant", description: "Fresh from the oven" },
								},
								price: 350,
								allergens: ["gluten", "dairy"],
								kitchenName: "Croissant",
							},
							{
								translations: {
									de: { name: "Brownie", description: "Schokoladig und saftig" },
									en: { name: "Brownie", description: "Chocolatey and moist" },
								},
								price: 420,
								allergens: ["gluten", "eggs", "dairy", "nuts"],
								kitchenName: "Brownie",
							},
						],
					},
					{
						translations: {
							de: { name: "Kaffee & Tee", description: "Specialty Coffee und feine Tees" },
							en: { name: "Coffee & Tea", description: "Specialty coffee and fine teas" },
						},
						vatGroupCode: "standard",
						items: [
							{
								translations: {
									de: { name: "Flat White", description: "Doppelter Espresso mit samtiger Milch" },
									en: { name: "Flat White", description: "Double espresso with velvety dairy" },
								},
								price: 420,
								allergens: ["dairy"],
								kitchenName: "Flat White",
								optionGroupCodes: ["milch-art", "kaffee-extras"],
							},
							{
								translations: {
									de: { name: "Cappuccino", description: "Mit Milchschaum-Herz" },
									en: { name: "Cappuccino", description: "With dairy foam heart" },
								},
								price: 390,
								allergens: ["dairy"],
								kitchenName: "Cappuccino",
								optionGroupCodes: ["milch-art", "kaffee-extras"],
							},
							{
								translations: {
									de: { name: "Matcha Latte", description: "Mit Hafermilch" },
									en: { name: "Matcha Latte", description: "With oat dairy" },
								},
								price: 490,
								kitchenName: "Matcha",
								optionGroupCodes: ["milch-art"],
							},
							{
								translations: {
									de: { name: "Chai Latte", description: "Würzig und wärmend" },
									en: { name: "Chai Latte", description: "Spiced and warming" },
								},
								price: 450,
								allergens: ["dairy"],
								kitchenName: "Chai",
								optionGroupCodes: ["milch-art"],
							},
							{
								translations: {
									de: { name: "Frischer Minztee", description: "Mit frischer Minze" },
									en: { name: "Fresh Mint Tea", description: "With fresh mint" },
								},
								price: 380,
								kitchenName: "Minztee",
							},
						],
					},
				],
				hours: [
					// Monday - Friday
					{ dayOfWeek: 1, openTime: "08:00", closeTime: "18:00", displayOrder: 0 },
					{ dayOfWeek: 2, openTime: "08:00", closeTime: "18:00", displayOrder: 0 },
					{ dayOfWeek: 3, openTime: "08:00", closeTime: "18:00", displayOrder: 0 },
					{ dayOfWeek: 4, openTime: "08:00", closeTime: "18:00", displayOrder: 0 },
					{ dayOfWeek: 5, openTime: "08:00", closeTime: "18:00", displayOrder: 0 },
					// Saturday - Sunday
					{ dayOfWeek: 6, openTime: "09:00", closeTime: "17:00", displayOrder: 0 },
					{ dayOfWeek: 0, openTime: "09:00", closeTime: "17:00", displayOrder: 0 },
				],
				orderTypes: {
					dine_in: { enabled: true, displayOrder: 0 },
					takeaway: { enabled: true, displayOrder: 1 },
					delivery: { enabled: false, displayOrder: 2 },
				},
				servicePoints: { prefix: "Tisch", startNumber: 1, count: 10, zone: "Innenraum" },
			},
		],
	},
];

// ============================================================================
// SEED RUNNER
// ============================================================================

export async function runSeed(services: DomainServices): Promise<void> {
	for (const merchantData of MERCHANTS) {
		await seedMerchant(services, merchantData);
	}
}

async function seedMerchant(
	services: DomainServices,
	merchantData: MerchantSeedData,
): Promise<void> {
	// Check if merchant already exists
	const emailExists = await services.merchants.isEmailRegistered(merchantData.email);
	if (emailExists) {
		console.log(`[SKIP] Merchant ${merchantData.email} already exists`);
		return;
	}

	// Create merchant
	console.log(`[CREATE] Merchant: ${merchantData.name}`);
	const merchant = await services.merchants.create({
		name: merchantData.name,
		ownerName: merchantData.ownerName,
		email: merchantData.email,
		phone: merchantData.phone,
		supportedLanguages: merchantData.supportedLanguages,
	});

	// Create VAT groups at merchant level and build a code -> id map
	const vatGroupMap = new Map<string, string>();
	for (const vatData of merchantData.vatGroups) {
		console.log(`  [CREATE] VAT Group: ${vatData.code}`);
		const vatGroup = await services.vat.create(merchant.id, vatData);
		vatGroupMap.set(vatData.code, vatGroup.id);
	}

	// Create stores for this merchant
	for (const storeData of merchantData.stores) {
		await seedStore(services, merchant.id, storeData, vatGroupMap);
	}
}

async function seedStore(
	services: DomainServices,
	merchantId: string,
	storeData: StoreSeedData,
	vatGroupMap: Map<string, string>,
): Promise<void> {
	// Create store
	console.log(`  [CREATE] Store: ${storeData.name}`);
	const store = await services.stores.create(merchantId, {
		name: storeData.name,
		slug: storeData.slug,
		street: storeData.street,
		city: storeData.city,
		postalCode: storeData.postalCode,
		country: storeData.country,
		phone: storeData.phone,
		email: storeData.email,
		timezone: storeData.timezone,
		currency: storeData.currency,
	});

	// Activate the store
	await services.stores.toggleActive(store.id, merchantId, true);

	// Create option groups and build code -> id map
	const optionGroupMap = new Map<string, string>();
	for (const optGroupData of storeData.optionGroups) {
		console.log(`    [CREATE] Option Group: ${optGroupData.translations.de?.name ?? optGroupData.code}`);

		const optGroup = await services.options.saveGroupWithChoices({
			storeId: store.id,
			merchantId,
			translations: optGroupData.translations,
			type: optGroupData.type,
			minSelections: optGroupData.minSelections,
			maxSelections: optGroupData.maxSelections,
			choices: optGroupData.choices.map((choice) => ({
				translations: choice.translations,
				priceModifier: choice.priceModifier,
				isDefault: choice.isDefault ?? false,
			})),
		});

		optionGroupMap.set(optGroupData.code, optGroup.id);
	}

	// Track items that need option groups linked
	const itemOptionLinks: Array<{ itemId: string; optionGroupIds: string[] }> = [];

	// Create categories with items
	for (let catIndex = 0; catIndex < storeData.categories.length; catIndex++) {
		const catData = storeData.categories[catIndex];
		if (!catData) continue;

		const defaultVatGroupId = catData.vatGroupCode
			? vatGroupMap.get(catData.vatGroupCode)
			: undefined;

		console.log(`    [CREATE] Category: ${catData.translations.de?.name ?? "Unknown"}`);

		const createCategoryInput: CreateCategoryInput = {
			storeId: store.id,
			translations: catData.translations,
			displayOrder: catIndex,
			isActive: true,
			defaultVatGroupId,
		};

		const category = await services.categories.create(merchantId, createCategoryInput);

		// Create items for this category
		for (let itemIndex = 0; itemIndex < catData.items.length; itemIndex++) {
			const itemData = catData.items[itemIndex];
			if (!itemData) continue;

			console.log(`      [CREATE] Item: ${itemData.translations.de?.name ?? "Unknown"}`);

			const createItemInput: CreateItemInput = {
				categoryId: category.id,
				translations: itemData.translations,
				price: itemData.price,
				displayOrder: itemIndex,
				isAvailable: true,
				allergens: itemData.allergens,
				kitchenName: itemData.kitchenName,
			};

			const item = await services.items.create(store.id, createItemInput);

			// Track option group links for this item
			if (itemData.optionGroupCodes && itemData.optionGroupCodes.length > 0) {
				const optionGroupIds = itemData.optionGroupCodes
					.map((code) => optionGroupMap.get(code))
					.filter((id): id is string => id !== undefined);

				if (optionGroupIds.length > 0) {
					itemOptionLinks.push({ itemId: item.id, optionGroupIds });
				}
			}
		}
	}

	// Link items to option groups
	for (const link of itemOptionLinks) {
		await services.options.updateItemOptions(link.itemId, merchantId, link.optionGroupIds);
	}
	if (itemOptionLinks.length > 0) {
		console.log(`    [LINK] ${itemOptionLinks.length} items linked to option groups`);
	}

	// Create store hours
	if (storeData.hours.length > 0) {
		console.log(`    [CREATE] Store Hours: ${storeData.hours.length} entries`);
		const saveHoursInput: SaveHoursInput = {
			storeId: store.id,
			hours: storeData.hours,
		};
		await services.hours.save(saveHoursInput, merchantId);
	}

	// Save order types
	console.log(`    [CREATE] Order Types`);
	await services.storeSettings.saveOrderTypes(
		{ storeId: store.id, orderTypes: storeData.orderTypes },
		merchantId,
	);

	// Create service points using batch create
	console.log(`    [CREATE] Service Points: ${storeData.servicePoints.count} tables`);
	await services.servicePoints.batchCreate(
		{
			storeId: store.id,
			prefix: storeData.servicePoints.prefix,
			startNumber: storeData.servicePoints.startNumber,
			count: storeData.servicePoints.count,
			zone: storeData.servicePoints.zone,
		},
		merchantId,
	);
}
