import {pgTable, text, timestamp, uuid, boolean, integer, bigint, jsonb, uniqueIndex, index, primaryKey, check} from 'drizzle-orm/pg-core';
import {sql} from 'drizzle-orm';
export * from './wishlist-schema.mjs';
const time = name => timestamp(name, {withTimezone:true});
export const sessions = pgTable('guest_sessions', {
  id:text('id').primaryKey(), createdAt:time('created_at').notNull().defaultNow(), expiresAt:time('expires_at').notNull(),
}, table=>[check('session_id_shape',sql`${table.id} ~ '^[a-f0-9]{64}$'`),index('guest_sessions_expiry_idx').on(table.expiresAt)]);
export const rsvps = pgTable('rsvps', {
  id:uuid('id').primaryKey(), sessionId:text('session_id').notNull().references(()=>sessions.id,{onDelete:'cascade'}),
  submissionKey:uuid('submission_key').notNull().defaultRandom(),guestName:text('guest_name').notNull(), attendance:text('attendance').notNull(), who:text('who').notNull().default(''),partyInterest:text('party_interest'),
  congratulationChoice:text('congratulation_choice'),congratulationCompanion:text('congratulation_companion'),
  returnTransfer:text('return_transfer'),
  venueRulesAccepted:boolean('venue_rules_accepted'),venueRulesAcceptedAt:time('venue_rules_accepted_at'),venueRulesVersion:text('venue_rules_version'),
  hotAppetizer:text('hot_appetizer_choice'),mainCourse:text('main_course_choice'),food:text('food').notNull().default(''),musicRequest:text('music_request'),alcoholDrinks:text('alcohol_drinks').array().notNull().default(sql`'{}'`),alcoholOther:text('alcohol_other').notNull().default(''),softDrinks:text('soft_drinks').array().notNull().default(sql`'{}'`),softOther:text('soft_other').notNull().default(''),transfer:text('transfer'),overnight:text('overnight'),
  dressCode:boolean('dress_code').notNull().default(false),createdAt:time('created_at').notNull().defaultNow(),updatedAt:time('updated_at').notNull().defaultNow(),
}, table=>[uniqueIndex('rsvp_session_submission_unique').on(table.sessionId,table.submissionKey),index('rsvp_session_idx').on(table.sessionId),index('rsvps_attendance_created_idx').on(table.attendance,table.createdAt,table.id),index('rsvps_created_idx').on(table.createdAt,table.id),
  check('rsvp_venue_consent_shape',sql`(${table.venueRulesAccepted} IS NULL AND ${table.venueRulesAcceptedAt} IS NULL AND ${table.venueRulesVersion} IS NULL) OR (${table.venueRulesAccepted} IS FALSE AND ${table.venueRulesAcceptedAt} IS NULL AND ${table.venueRulesVersion} IS NULL) OR (${table.venueRulesAccepted} IS TRUE AND ${table.attendance}='yes' AND ${table.venueRulesAcceptedAt} IS NOT NULL AND ${table.venueRulesVersion} IS NOT NULL AND char_length(btrim(${table.venueRulesVersion})) BETWEEN 1 AND 80)`),
  // Migration 006 uses NOT VALID so historical answers are retained unchanged.
  check('rsvp_party_interest_values',sql`${table.partyInterest} IS NULL OR ${table.partyInterest} IN ('yes','no')`),
  check('rsvp_no_party_interest_when_declined',sql`${table.attendance}='yes' OR ${table.partyInterest} IS NULL`),
  check('rsvp_return_transfer_values',sql`${table.returnTransfer} IS NULL OR ${table.returnTransfer} IN ('needed','not_needed')`),
  check('rsvp_no_return_transfer',sql`${table.attendance}='yes' OR ${table.returnTransfer} IS NULL`),
  check('rsvp_text_limits_v2',sql`char_length(${table.guestName}) BETWEEN 1 AND 80 AND char_length(${table.who})<=120 AND char_length(${table.food})<=300 AND (${table.musicRequest} IS NULL OR char_length(${table.musicRequest})<=300) AND char_length(${table.alcoholOther})<=80 AND char_length(${table.softOther})<=80`),
  check('rsvp_going_required_v2',sql`${table.attendance}='no' OR (char_length(btrim(${table.who}))>0 AND cardinality(${table.alcoholDrinks})>0 AND cardinality(${table.softDrinks})>0)`),
  check('rsvp_music_length',sql`${table.musicRequest} IS NULL OR char_length(${table.musicRequest})<=1000`),
  check('rsvp_congratulation_values',sql`${table.congratulationChoice} IS NULL OR ${table.congratulationChoice} IN ('public','private','public_with_someone')`),
  check('rsvp_congratulation_companion',sql`(${table.congratulationChoice} IS NOT DISTINCT FROM 'public_with_someone' AND ${table.congratulationCompanion} IS NOT NULL AND char_length(btrim(${table.congratulationCompanion})) BETWEEN 1 AND 120) OR (${table.congratulationChoice} IS DISTINCT FROM 'public_with_someone' AND ${table.congratulationCompanion} IS NULL)`),
  check('rsvp_no_congratulation',sql`${table.attendance}='yes' OR (${table.congratulationChoice} IS NULL AND ${table.congratulationCompanion} IS NULL)`),
  check('rsvp_hot_appetizer_values',sql`${table.hotAppetizer} IS NULL OR ${table.hotAppetizer} IN ('hot_meat','hot_fish')`),
  check('rsvp_main_course_values',sql`${table.mainCourse} IS NULL OR ${table.mainCourse} IN ('main_meat','main_fish')`),
  check('rsvp_no_menu',sql`${table.attendance}='yes' OR (${table.hotAppetizer} IS NULL AND ${table.mainCourse} IS NULL)`),
  check('rsvp_no_music',sql`${table.attendance}='yes' OR ${table.musicRequest} IS NULL`),
  check('attendance_values',sql`${table.attendance} IN ('yes','no')`),
  check('rsvp_name_length',sql`char_length(${table.guestName}) BETWEEN 1 AND 120`),
  check('rsvp_details_length',sql`char_length(${table.who}) <= 240 AND char_length(${table.food}) <= 600`),
  check('rsvp_transfer_values',sql`${table.transfer} IN ('needed','self','kupchino','pavlovsk')`),
  check('rsvp_overnight_values',sql`${table.overnight} IN ('stay','leave')`),
  check('rsvp_attendance_details',sql`(${table.attendance}='yes' AND ${table.transfer} IS NOT NULL AND ${table.dressCode}) OR (${table.attendance}='no' AND ${table.transfer} IS NULL AND ${table.overnight} IS NULL AND NOT ${table.dressCode} AND ${table.who}='' AND ${table.food}='')`),
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

export const pollingState=pgTable('telegram_polling_state',{botId:bigint('bot_id',{mode:'number'}).primaryKey(),nextOffset:bigint('next_offset',{mode:'number'}).notNull().default(0),updatedAt:time('updated_at').notNull().defaultNow()},table=>[check('telegram_polling_offset_nonnegative',sql`${table.nextOffset} >= 0`)]);
