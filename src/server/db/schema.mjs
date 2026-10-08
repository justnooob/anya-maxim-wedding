import {pgTable, text, timestamp, uuid, boolean, integer, bigint, jsonb, uniqueIndex, index, primaryKey, check} from 'drizzle-orm/pg-core';
import {sql} from 'drizzle-orm';
const time = name => timestamp(name, {withTimezone:true});
export const sessions = pgTable('guest_sessions', {
  id:text('id').primaryKey(), createdAt:time('created_at').notNull().defaultNow(), expiresAt:time('expires_at').notNull(),
}, table=>[check('session_id_shape',sql`${table.id} ~ '^[a-f0-9]{64}$'`),index('guest_sessions_expiry_idx').on(table.expiresAt)]);
export const rsvps = pgTable('rsvps', {
  id:uuid('id').primaryKey(), sessionId:text('session_id').notNull().references(()=>sessions.id,{onDelete:'cascade'}),
  guestName:text('guest_name').notNull(), attendance:text('attendance').notNull(), who:text('who').notNull().default(''),
  food:text('food').notNull().default(''),alcoholDrinks:text('alcohol_drinks').array().notNull().default(sql`'{}'`),alcoholOther:text('alcohol_other').notNull().default(''),softDrinks:text('soft_drinks').array().notNull().default(sql`'{}'`),softOther:text('soft_other').notNull().default(''),transfer:text('transfer'),overnight:text('overnight'),
  dressCode:boolean('dress_code').notNull().default(false),createdAt:time('created_at').notNull().defaultNow(),updatedAt:time('updated_at').notNull().defaultNow(),
}, table=>[uniqueIndex('rsvp_session_unique').on(table.sessionId),index('rsvps_attendance_created_idx').on(table.attendance,table.createdAt,table.id),index('rsvps_created_idx').on(table.createdAt,table.id),
  check('attendance_values',sql`${table.attendance} IN ('yes','no')`),
  check('rsvp_name_length',sql`char_length(${table.guestName}) BETWEEN 1 AND 120`),
  check('rsvp_details_length',sql`char_length(${table.who}) <= 240 AND char_length(${table.food}) <= 600`),
  check('rsvp_transfer_values',sql`${table.transfer} IN ('needed','self')`),
  check('rsvp_overnight_values',sql`${table.overnight} IN ('stay','leave')`),
  check('rsvp_attendance_details',sql`(${table.attendance}='yes' AND ${table.transfer} IS NOT NULL AND ${table.overnight} IS NOT NULL AND ${table.dressCode}) OR (${table.attendance}='no' AND ${table.transfer} IS NULL AND ${table.overnight} IS NULL AND NOT ${table.dressCode} AND ${table.who}='' AND ${table.food}='')`),
  check('rsvp_alcohol_choices',sql`${table.alcoholDrinks} <@ ARRAY['wine','red_wine','white_wine','cognac','vodka','whisky','rum','gin','jagermeister','other','none']::text[] AND cardinality(${table.alcoholDrinks})<=11 AND array_position(${table.alcoholDrinks},NULL) IS NULL`),
  check('rsvp_soft_choices',sql`${table.softDrinks} <@ ARRAY['cola','sprite','fanta','tonic','apple_juice','multifruit_juice','orange_juice','tomato_juice','sparkling_water','still_water','other','none']::text[] AND cardinality(${table.softDrinks})<=12 AND array_position(${table.softDrinks},NULL) IS NULL`),
  check('rsvp_alcohol_none',sql`NOT ('none'=ANY(${table.alcoholDrinks})) OR cardinality(${table.alcoholDrinks})=1`),
  check('rsvp_soft_none',sql`NOT ('none'=ANY(${table.softDrinks})) OR cardinality(${table.softDrinks})=1`),
  check('rsvp_drink_other_length',sql`char_length(${table.alcoholOther})<=120 AND char_length(${table.softOther})<=120`),
  check('rsvp_drink_other_required',sql`(('other'=ANY(${table.alcoholDrinks})) AND char_length(btrim(${table.alcoholOther}))>0 OR NOT ('other'=ANY(${table.alcoholDrinks})) AND ${table.alcoholOther}='') AND (('other'=ANY(${table.softDrinks})) AND char_length(btrim(${table.softOther}))>0 OR NOT ('other'=ANY(${table.softDrinks})) AND ${table.softOther}='')`),
  check('rsvp_no_drinks',sql`${table.attendance}='yes' OR (cardinality(${table.alcoholDrinks})=0 AND cardinality(${table.softDrinks})=0 AND ${table.alcoholOther}='' AND ${table.softOther}='')`)]);
export const updates=pgTable('telegram_updates',{id:bigint('id',{mode:'number'}).primaryKey(),createdAt:time('created_at').notNull().defaultNow()});
export const outbox=pgTable('telegram_outbox',{id:uuid('id').primaryKey(),rsvpId:uuid('rsvp_id').references(()=>rsvps.id,{onDelete:'cascade'}),recipient:text('recipient').notNull(),payload:jsonb('payload').notNull(),attempts:integer('attempts').notNull().default(0),availableAt:time('available_at').notNull().defaultNow(),createdAt:time('created_at').notNull().defaultNow()},table=>[index('telegram_outbox_ready_idx').on(table.availableAt,table.createdAt),check('outbox_recipient_shape',sql`${table.recipient} ~ '^[1-9][0-9]*$'`),check('outbox_attempts_nonnegative',sql`${table.attempts} >= 0`)]);
export const confirmations=pgTable('delete_confirmations',{token:text('token').primaryKey(),rsvpId:uuid('rsvp_id').notNull().references(()=>rsvps.id,{onDelete:'cascade'}),userId:text('user_id').notNull(),expiresAt:time('expires_at').notNull(),createdAt:time('created_at').notNull().defaultNow()},table=>[index('delete_confirmations_expiry_idx').on(table.expiresAt),check('confirmation_token_shape',sql`${table.token} ~ '^[a-f0-9]{32}$'`)]);
export const rateLimits=pgTable('rate_limits',{key:text('key').notNull(),bucket:bigint('bucket',{mode:'number'}).notNull(),count:integer('count').notNull().default(1)},table=>[primaryKey({columns:[table.key,table.bucket]}),check('rate_count_positive',sql`${table.count} > 0`)]);
