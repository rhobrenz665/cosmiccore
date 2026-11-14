import { sql } from "drizzle-orm";
import { check, index, pgTable, text, timestamp, uniqueIndex, uuid } from "drizzle-orm/pg-core";

export const appUsers = pgTable(
  "app_users",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    authIssuer: text("auth_issuer").notNull(),
    authSubject: text("auth_subject").notNull(),
    email: text("email").notNull(),
    displayName: text("display_name"),
    avatarUrl: text("avatar_url"),
    status: text("status").notNull().default("active"),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    uniqueIndex("app_users_auth_identity_key").on(table.authIssuer, table.authSubject),
    index("app_users_email_idx").on(table.email),
    check("app_users_status_check", sql`${table.status} in ('active', 'deletion_pending', 'blocked')`),
  ],
);

export type AppUser = typeof appUsers.$inferSelect;
