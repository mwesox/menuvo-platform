CREATE INDEX "idx_categories_store" ON "categories" USING btree ("store_id");--> statement-breakpoint
CREATE INDEX "idx_item_option_groups_item" ON "item_option_groups" USING btree ("item_id");--> statement-breakpoint
CREATE INDEX "idx_item_option_groups_group" ON "item_option_groups" USING btree ("option_group_id");--> statement-breakpoint
CREATE INDEX "idx_items_category" ON "items" USING btree ("category_id");--> statement-breakpoint
CREATE INDEX "idx_items_store" ON "items" USING btree ("store_id");--> statement-breakpoint
CREATE INDEX "idx_option_choices_group" ON "option_choices" USING btree ("option_group_id");--> statement-breakpoint
CREATE INDEX "idx_option_groups_store" ON "option_groups" USING btree ("store_id");