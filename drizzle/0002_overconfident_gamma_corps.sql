ALTER TABLE "images" ADD COLUMN "kind" text DEFAULT 'inline' NOT NULL;--> statement-breakpoint
ALTER TABLE "images" ADD COLUMN "source_id" text;--> statement-breakpoint
ALTER TABLE "images" ADD COLUMN "title" text;--> statement-breakpoint
ALTER TABLE "images" ADD COLUMN "creator" text;--> statement-breakpoint
ALTER TABLE "images" ADD COLUMN "date" text;--> statement-breakpoint
ALTER TABLE "images" ADD COLUMN "source" text;--> statement-breakpoint
ALTER TABLE "images" ADD COLUMN "source_url" text;--> statement-breakpoint
ALTER TABLE "images" ADD COLUMN "license" text;--> statement-breakpoint
ALTER TABLE "posts" ADD COLUMN "cover_credit" text;--> statement-breakpoint
CREATE INDEX "images_kind_idx" ON "images" USING btree ("kind");--> statement-breakpoint
CREATE INDEX "images_source_id_idx" ON "images" USING btree ("source_id");