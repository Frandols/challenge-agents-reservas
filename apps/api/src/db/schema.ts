import { sql } from "drizzle-orm";
import { check, index, integer, sqliteTable, text } from "drizzle-orm/sqlite-core";

export const units = sqliteTable("units", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
});

export const reservations = sqliteTable(
  "reservations",
  {
    id: integer("id").primaryKey({ autoIncrement: true }),
    unitId: text("unit_id")
      .notNull()
      .references(() => units.id),
    requester: text("requester").notNull(),
    startsAt: text("starts_at").notNull(),
    endsAt: text("ends_at").notNull(),
    status: text("status", { enum: ["active", "cancelled"] }).notNull(),
    createdAt: text("created_at").notNull(),
    cancelledAt: text("cancelled_at"),
  },
  (table) => [
    index("reservations_unit_status_start_idx").on(table.unitId, table.status, table.startsAt),
    check("reservations_interval_check", sql`${table.startsAt} < ${table.endsAt}`),
    check("reservations_status_check", sql`${table.status} in ('active', 'cancelled')`),
    check("reservations_requester_check", sql`trim(${table.requester}) <> ''`),
  ],
);
