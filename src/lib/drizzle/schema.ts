import { pgTable, pgSchema, index, foreignKey, check, uuid, jsonb, boolean, text, timestamp, smallint, varchar, bigserial, uniqueIndex, json, inet, bigint, unique, primaryKey } from "drizzle-orm/pg-core"
import { sql } from "drizzle-orm"

export const auth = pgSchema("auth");
export const app = pgSchema("app");
export const attemptResultInApp = app.enum("attempt_result", ['incorrect', 'partial', 'correct'])
export const exerciseTypeInApp = app.enum("exercise_type", ['multiple_choice'])
export const aalLevelInAuth = auth.enum("aal_level", ['aal1', 'aal2', 'aal3'])
export const codeChallengeMethodInAuth = auth.enum("code_challenge_method", ['s256', 'plain'])
export const factorStatusInAuth = auth.enum("factor_status", ['unverified', 'verified'])
export const factorTypeInAuth = auth.enum("factor_type", ['totp', 'webauthn', 'phone'])
export const oauthAuthorizationStatusInAuth = auth.enum("oauth_authorization_status", ['pending', 'approved', 'denied', 'expired'])
export const oauthClientTypeInAuth = auth.enum("oauth_client_type", ['public', 'confidential'])
export const oauthRegistrationTypeInAuth = auth.enum("oauth_registration_type", ['dynamic', 'manual'])
export const oauthResponseTypeInAuth = auth.enum("oauth_response_type", ['code'])
export const oneTimeTokenTypeInAuth = auth.enum("one_time_token_type", ['confirmation_token', 'reauthentication_token', 'recovery_token', 'email_change_token_new', 'email_change_token_current', 'phone_change_token'])


export const exercisesInApp = app.table("exercises", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	ownerProfileId: uuid("owner_profile_id"),
	type: exerciseTypeInApp().default('multiple_choice').notNull(),
	prompt: jsonb().notNull(),
	explanation: jsonb(),
	isPublic: boolean("is_public").default(false).notNull(),
	allowMultiple: boolean("allow_multiple").default(false).notNull(),
	sourceName: text("source_name"),
	sourceUrl: text("source_url"),
	createdAt: timestamp("created_at", { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
	updatedAt: timestamp("updated_at", { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
	title: text().notNull(),
}, (table) => [
	index("exercises_owner_profile_id_idx").using("btree", table.ownerProfileId.asc().nullsLast().op("uuid_ops")),
	index("exercises_public_idx").using("btree", table.createdAt.desc().nullsFirst().op("timestamptz_ops")).where(sql`(is_public = true)`),
	foreignKey({
			columns: [table.ownerProfileId],
			foreignColumns: [profilesInApp.id],
			name: "exercises_owner_profile_id_fkey"
		}),
	check("exercises_title_check", sql`char_length(btrim(title)) > 0`),
]);

export const samlRelayStatesInAuth = auth.table("saml_relay_states", {
	id: uuid().notNull(),
	ssoProviderId: uuid("sso_provider_id").notNull(),
	requestId: text("request_id").notNull(),
	forEmail: text("for_email"),
	redirectTo: text("redirect_to"),
	createdAt: timestamp("created_at", { withTimezone: true, mode: 'string' }),
	updatedAt: timestamp("updated_at", { withTimezone: true, mode: 'string' }),
	flowStateId: uuid("flow_state_id"),
}, (table) => [
	index("saml_relay_states_created_at_idx").using("btree", table.createdAt.desc().nullsFirst().op("timestamptz_ops")),
	index("saml_relay_states_for_email_idx").using("btree", table.forEmail.asc().nullsLast().op("text_ops")),
	index("saml_relay_states_sso_provider_id_idx").using("btree", table.ssoProviderId.asc().nullsLast().op("uuid_ops")),
	foreignKey({
			columns: [table.flowStateId],
			foreignColumns: [flowStateInAuth.id],
			name: "saml_relay_states_flow_state_id_fkey"
		}).onDelete("cascade"),
	foreignKey({
			columns: [table.ssoProviderId],
			foreignColumns: [ssoProvidersInAuth.id],
			name: "saml_relay_states_sso_provider_id_fkey"
		}).onDelete("cascade"),
	check("request_id not empty", sql`char_length(request_id) > 0`),
]);

export const flowStateInAuth = auth.table("flow_state", {
	id: uuid().notNull(),
	userId: uuid("user_id"),
	authCode: text("auth_code"),
	codeChallengeMethod: codeChallengeMethodInAuth("code_challenge_method"),
	codeChallenge: text("code_challenge"),
	providerType: text("provider_type").notNull(),
	providerAccessToken: text("provider_access_token"),
	providerRefreshToken: text("provider_refresh_token"),
	createdAt: timestamp("created_at", { withTimezone: true, mode: 'string' }),
	updatedAt: timestamp("updated_at", { withTimezone: true, mode: 'string' }),
	authenticationMethod: text("authentication_method").notNull(),
	authCodeIssuedAt: timestamp("auth_code_issued_at", { withTimezone: true, mode: 'string' }),
	inviteToken: text("invite_token"),
	referrer: text(),
	oauthClientStateId: uuid("oauth_client_state_id"),
	linkingTargetId: uuid("linking_target_id"),
	emailOptional: boolean("email_optional").default(false).notNull(),
}, (table) => [
	index("flow_state_created_at_idx").using("btree", table.createdAt.desc().nullsFirst().op("timestamptz_ops")),
	index("idx_auth_code").using("btree", table.authCode.asc().nullsLast().op("text_ops")),
	index("idx_user_id_auth_method").using("btree", table.userId.asc().nullsLast().op("uuid_ops"), table.authenticationMethod.asc().nullsLast().op("uuid_ops")),
]);

export const samlProvidersInAuth = auth.table("saml_providers", {
	id: uuid().notNull(),
	ssoProviderId: uuid("sso_provider_id").notNull(),
	entityId: text("entity_id").notNull(),
	metadataXml: text("metadata_xml").notNull(),
	metadataUrl: text("metadata_url"),
	attributeMapping: jsonb("attribute_mapping"),
	createdAt: timestamp("created_at", { withTimezone: true, mode: 'string' }),
	updatedAt: timestamp("updated_at", { withTimezone: true, mode: 'string' }),
	nameIdFormat: text("name_id_format"),
}, (table) => [
	index("saml_providers_sso_provider_id_idx").using("btree", table.ssoProviderId.asc().nullsLast().op("uuid_ops")),
	foreignKey({
			columns: [table.ssoProviderId],
			foreignColumns: [ssoProvidersInAuth.id],
			name: "saml_providers_sso_provider_id_fkey"
		}).onDelete("cascade"),
	check("entity_id not empty", sql`char_length(entity_id) > 0`),
	check("metadata_url not empty", sql`(metadata_url = NULL::text) OR (char_length(metadata_url) > 0)`),
	check("metadata_xml not empty", sql`char_length(metadata_xml) > 0`),
]);

export const exerciseChoicesInApp = app.table("exercise_choices", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	exerciseId: uuid("exercise_id").notNull(),
	content: jsonb().notNull(),
	isCorrect: boolean("is_correct").default(false).notNull(),
	position: smallint().notNull(),
	createdAt: timestamp("created_at", { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
}, (table) => [
	index("exercise_choices_exercise_id_position_idx").using("btree", table.exerciseId.asc().nullsLast().op("int2_ops"), table.position.asc().nullsLast().op("int2_ops")),
	foreignKey({
			columns: [table.exerciseId],
			foreignColumns: [exercisesInApp.id],
			name: "exercise_choices_exercise_id_fkey"
		}).onDelete("cascade"),
]);

export const instancesInAuth = auth.table("instances", {
	id: uuid().notNull(),
	uuid: uuid(),
	rawBaseConfig: text("raw_base_config"),
	createdAt: timestamp("created_at", { withTimezone: true, mode: 'string' }),
	updatedAt: timestamp("updated_at", { withTimezone: true, mode: 'string' }),
});

export const exerciseAttemptsInApp = app.table("exercise_attempts", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	profileId: uuid("profile_id").notNull(),
	exerciseId: uuid("exercise_id").notNull(),
	selectedChoiceIds: jsonb("selected_choice_ids").notNull(),
	result: attemptResultInApp().notNull(),
	createdAt: timestamp("created_at", { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
}, (table) => [
	index("exercise_attempts_exercise_id_idx").using("btree", table.exerciseId.asc().nullsLast().op("uuid_ops")),
	index("exercise_attempts_profile_exercise_created_at_idx").using("btree", table.profileId.asc().nullsLast().op("timestamptz_ops"), table.exerciseId.asc().nullsLast().op("timestamptz_ops"), table.createdAt.desc().nullsFirst().op("timestamptz_ops")),
	foreignKey({
			columns: [table.exerciseId],
			foreignColumns: [exercisesInApp.id],
			name: "exercise_attempts_exercise_id_fkey"
		}),
	foreignKey({
			columns: [table.profileId],
			foreignColumns: [profilesInApp.id],
			name: "exercise_attempts_profile_id_fkey"
		}).onDelete("cascade"),
]);

export const schemaMigrationsInAuth = auth.table("schema_migrations", {
	version: varchar({ length: 255 }).notNull(),
});

export const refreshTokensInAuth = auth.table("refresh_tokens", {
	instanceId: uuid("instance_id"),
	id: bigserial({ mode: "bigint" }).notNull(),
	token: varchar({ length: 255 }),
	userId: varchar("user_id", { length: 255 }),
	revoked: boolean(),
	createdAt: timestamp("created_at", { withTimezone: true, mode: 'string' }),
	updatedAt: timestamp("updated_at", { withTimezone: true, mode: 'string' }),
	parent: varchar({ length: 255 }),
	sessionId: uuid("session_id"),
}, (table) => [
	index("refresh_tokens_instance_id_idx").using("btree", table.instanceId.asc().nullsLast().op("uuid_ops")),
	index("refresh_tokens_instance_id_user_id_idx").using("btree", table.instanceId.asc().nullsLast().op("text_ops"), table.userId.asc().nullsLast().op("text_ops")),
	index("refresh_tokens_parent_idx").using("btree", table.parent.asc().nullsLast().op("text_ops")),
	index("refresh_tokens_session_id_revoked_idx").using("btree", table.sessionId.asc().nullsLast().op("bool_ops"), table.revoked.asc().nullsLast().op("bool_ops")),
	index("refresh_tokens_updated_at_idx").using("btree", table.updatedAt.desc().nullsFirst().op("timestamptz_ops")),
	foreignKey({
			columns: [table.sessionId],
			foreignColumns: [sessionsInAuth.id],
			name: "refresh_tokens_session_id_fkey"
		}).onDelete("cascade"),
]);

export const usersInAuth = auth.table("users", {
	instanceId: uuid("instance_id"),
	id: uuid().notNull(),
	aud: varchar({ length: 255 }),
	role: varchar({ length: 255 }),
	email: varchar({ length: 255 }),
	encryptedPassword: varchar("encrypted_password", { length: 255 }),
	emailConfirmedAt: timestamp("email_confirmed_at", { withTimezone: true, mode: 'string' }),
	invitedAt: timestamp("invited_at", { withTimezone: true, mode: 'string' }),
	confirmationToken: varchar("confirmation_token", { length: 255 }),
	confirmationSentAt: timestamp("confirmation_sent_at", { withTimezone: true, mode: 'string' }),
	recoveryToken: varchar("recovery_token", { length: 255 }),
	recoverySentAt: timestamp("recovery_sent_at", { withTimezone: true, mode: 'string' }),
	emailChangeTokenNew: varchar("email_change_token_new", { length: 255 }),
	emailChange: varchar("email_change", { length: 255 }),
	emailChangeSentAt: timestamp("email_change_sent_at", { withTimezone: true, mode: 'string' }),
	lastSignInAt: timestamp("last_sign_in_at", { withTimezone: true, mode: 'string' }),
	rawAppMetaData: jsonb("raw_app_meta_data"),
	rawUserMetaData: jsonb("raw_user_meta_data"),
	isSuperAdmin: boolean("is_super_admin"),
	createdAt: timestamp("created_at", { withTimezone: true, mode: 'string' }),
	updatedAt: timestamp("updated_at", { withTimezone: true, mode: 'string' }),
	phone: text().default(sql`NULL`),
	phoneConfirmedAt: timestamp("phone_confirmed_at", { withTimezone: true, mode: 'string' }),
	phoneChange: text("phone_change").default(''),
	phoneChangeToken: varchar("phone_change_token", { length: 255 }).default(''),
	phoneChangeSentAt: timestamp("phone_change_sent_at", { withTimezone: true, mode: 'string' }),
	confirmedAt: timestamp("confirmed_at", { withTimezone: true, mode: 'string' }).generatedAlwaysAs(sql`LEAST(email_confirmed_at, phone_confirmed_at)`),
	emailChangeTokenCurrent: varchar("email_change_token_current", { length: 255 }).default(''),
	emailChangeConfirmStatus: smallint("email_change_confirm_status").default(0),
	bannedUntil: timestamp("banned_until", { withTimezone: true, mode: 'string' }),
	reauthenticationToken: varchar("reauthentication_token", { length: 255 }).default(''),
	reauthenticationSentAt: timestamp("reauthentication_sent_at", { withTimezone: true, mode: 'string' }),
	isSsoUser: boolean("is_sso_user").default(false).notNull(),
	deletedAt: timestamp("deleted_at", { withTimezone: true, mode: 'string' }),
	isAnonymous: boolean("is_anonymous").default(false).notNull(),
}, (table) => [
	uniqueIndex("confirmation_token_idx").using("btree", table.confirmationToken.asc().nullsLast().op("text_ops")).where(sql`((confirmation_token)::text !~ '^[0-9 ]*$'::text)`),
	uniqueIndex("email_change_token_current_idx").using("btree", table.emailChangeTokenCurrent.asc().nullsLast().op("text_ops")).where(sql`((email_change_token_current)::text !~ '^[0-9 ]*$'::text)`),
	uniqueIndex("email_change_token_new_idx").using("btree", table.emailChangeTokenNew.asc().nullsLast().op("text_ops")).where(sql`((email_change_token_new)::text !~ '^[0-9 ]*$'::text)`),
	index("idx_users_created_at_desc").using("btree", table.createdAt.desc().nullsFirst().op("timestamptz_ops")),
	index("idx_users_email").using("btree", table.email.asc().nullsLast().op("text_ops")),
	index("idx_users_last_sign_in_at_desc").using("btree", table.lastSignInAt.desc().nullsFirst().op("timestamptz_ops")),
	index("idx_users_name").using("btree", sql`((raw_user_meta_data ->> 'name'::text))`).where(sql`((raw_user_meta_data ->> 'name'::text) IS NOT NULL)`),
	uniqueIndex("reauthentication_token_idx").using("btree", table.reauthenticationToken.asc().nullsLast().op("text_ops")).where(sql`((reauthentication_token)::text !~ '^[0-9 ]*$'::text)`),
	uniqueIndex("recovery_token_idx").using("btree", table.recoveryToken.asc().nullsLast().op("text_ops")).where(sql`((recovery_token)::text !~ '^[0-9 ]*$'::text)`),
	uniqueIndex("users_email_partial_key").using("btree", table.email.asc().nullsLast().op("text_ops")).where(sql`(is_sso_user = false)`),
	index("users_instance_id_email_idx").using("btree", sql`instance_id`, sql`lower((email)::text)`),
	index("users_instance_id_idx").using("btree", table.instanceId.asc().nullsLast().op("uuid_ops")),
	index("users_is_anonymous_idx").using("btree", table.isAnonymous.asc().nullsLast().op("bool_ops")),
	check("users_email_change_confirm_status_check", sql`(email_change_confirm_status >= 0) AND (email_change_confirm_status <= 2)`),
]);

export const auditLogEntriesInAuth = auth.table("audit_log_entries", {
	instanceId: uuid("instance_id"),
	id: uuid().notNull(),
	payload: json(),
	createdAt: timestamp("created_at", { withTimezone: true, mode: 'string' }),
	ipAddress: varchar("ip_address", { length: 64 }).default('').notNull(),
}, (table) => [
	index("audit_logs_instance_id_idx").using("btree", table.instanceId.asc().nullsLast().op("uuid_ops")),
]);

export const ssoDomainsInAuth = auth.table("sso_domains", {
	id: uuid().notNull(),
	ssoProviderId: uuid("sso_provider_id").notNull(),
	domain: text().notNull(),
	createdAt: timestamp("created_at", { withTimezone: true, mode: 'string' }),
	updatedAt: timestamp("updated_at", { withTimezone: true, mode: 'string' }),
}, (table) => [
	uniqueIndex("sso_domains_domain_idx").using("btree", sql`lower(domain)`),
	index("sso_domains_sso_provider_id_idx").using("btree", table.ssoProviderId.asc().nullsLast().op("uuid_ops")),
	foreignKey({
			columns: [table.ssoProviderId],
			foreignColumns: [ssoProvidersInAuth.id],
			name: "sso_domains_sso_provider_id_fkey"
		}).onDelete("cascade"),
	check("domain not empty", sql`char_length(domain) > 0`),
]);

export const mfaAmrClaimsInAuth = auth.table("mfa_amr_claims", {
	sessionId: uuid("session_id").notNull(),
	createdAt: timestamp("created_at", { withTimezone: true, mode: 'string' }).notNull(),
	updatedAt: timestamp("updated_at", { withTimezone: true, mode: 'string' }).notNull(),
	authenticationMethod: text("authentication_method").notNull(),
	id: uuid().notNull(),
}, (table) => [
	foreignKey({
			columns: [table.sessionId],
			foreignColumns: [sessionsInAuth.id],
			name: "mfa_amr_claims_session_id_fkey"
		}).onDelete("cascade"),
]);

export const identitiesInAuth = auth.table("identities", {
	providerId: text("provider_id").notNull(),
	userId: uuid("user_id").notNull(),
	identityData: jsonb("identity_data").notNull(),
	provider: text().notNull(),
	lastSignInAt: timestamp("last_sign_in_at", { withTimezone: true, mode: 'string' }),
	createdAt: timestamp("created_at", { withTimezone: true, mode: 'string' }),
	updatedAt: timestamp("updated_at", { withTimezone: true, mode: 'string' }),
	email: text().generatedAlwaysAs(sql`lower((identity_data ->> 'email'::text))`),
	id: uuid().defaultRandom().notNull(),
}, (table) => [
	index("identities_email_idx").using("btree", table.email.asc().nullsLast().op("text_pattern_ops")),
	index("identities_user_id_idx").using("btree", table.userId.asc().nullsLast().op("uuid_ops")),
	foreignKey({
			columns: [table.userId],
			foreignColumns: [usersInAuth.id],
			name: "identities_user_id_fkey"
		}).onDelete("cascade"),
]);

export const oneTimeTokensInAuth = auth.table("one_time_tokens", {
	id: uuid().notNull(),
	userId: uuid("user_id").notNull(),
	tokenType: oneTimeTokenTypeInAuth("token_type").notNull(),
	tokenHash: text("token_hash").notNull(),
	relatesTo: text("relates_to").notNull(),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow().notNull(),
	updatedAt: timestamp("updated_at", { mode: 'string' }).defaultNow().notNull(),
}, (table) => [
	index("one_time_tokens_relates_to_hash_idx").using("hash", table.relatesTo.asc().nullsLast().op("text_ops")),
	index("one_time_tokens_token_hash_hash_idx").using("hash", table.tokenHash.asc().nullsLast().op("text_ops")),
	uniqueIndex("one_time_tokens_user_id_token_type_key").using("btree", table.userId.asc().nullsLast().op("uuid_ops"), table.tokenType.asc().nullsLast().op("uuid_ops")),
	foreignKey({
			columns: [table.userId],
			foreignColumns: [usersInAuth.id],
			name: "one_time_tokens_user_id_fkey"
		}).onDelete("cascade"),
	check("one_time_tokens_token_hash_check", sql`char_length(token_hash) > 0`),
]);

export const sessionsInAuth = auth.table("sessions", {
	id: uuid().notNull(),
	userId: uuid("user_id").notNull(),
	createdAt: timestamp("created_at", { withTimezone: true, mode: 'string' }),
	updatedAt: timestamp("updated_at", { withTimezone: true, mode: 'string' }),
	factorId: uuid("factor_id"),
	aal: aalLevelInAuth(),
	notAfter: timestamp("not_after", { withTimezone: true, mode: 'string' }),
	refreshedAt: timestamp("refreshed_at", { mode: 'string' }),
	userAgent: text("user_agent"),
	ip: inet(),
	tag: text(),
	oauthClientId: uuid("oauth_client_id"),
	refreshTokenHmacKey: text("refresh_token_hmac_key"),
	// You can use { mode: "bigint" } if numbers are exceeding js number limitations
	refreshTokenCounter: bigint("refresh_token_counter", { mode: "number" }),
	scopes: text(),
}, (table) => [
	index("sessions_not_after_idx").using("btree", table.notAfter.desc().nullsFirst().op("timestamptz_ops")),
	index("sessions_oauth_client_id_idx").using("btree", table.oauthClientId.asc().nullsLast().op("uuid_ops")),
	index("sessions_user_id_idx").using("btree", table.userId.asc().nullsLast().op("uuid_ops")),
	index("user_id_created_at_idx").using("btree", table.userId.asc().nullsLast().op("uuid_ops"), table.createdAt.asc().nullsLast().op("timestamptz_ops")),
	foreignKey({
			columns: [table.oauthClientId],
			foreignColumns: [oauthClientsInAuth.id],
			name: "sessions_oauth_client_id_fkey"
		}).onDelete("cascade"),
	foreignKey({
			columns: [table.userId],
			foreignColumns: [usersInAuth.id],
			name: "sessions_user_id_fkey"
		}).onDelete("cascade"),
	check("sessions_scopes_length", sql`char_length(scopes) <= 4096`),
]);

export const mfaChallengesInAuth = auth.table("mfa_challenges", {
	id: uuid().notNull(),
	factorId: uuid("factor_id").notNull(),
	createdAt: timestamp("created_at", { withTimezone: true, mode: 'string' }).notNull(),
	verifiedAt: timestamp("verified_at", { withTimezone: true, mode: 'string' }),
	ipAddress: inet("ip_address").notNull(),
	otpCode: text("otp_code"),
	webAuthnSessionData: jsonb("web_authn_session_data"),
}, (table) => [
	index("mfa_challenge_created_at_idx").using("btree", table.createdAt.desc().nullsFirst().op("timestamptz_ops")),
	foreignKey({
			columns: [table.factorId],
			foreignColumns: [mfaFactorsInAuth.id],
			name: "mfa_challenges_auth_factor_id_fkey"
		}).onDelete("cascade"),
]);

export const ssoProvidersInAuth = auth.table("sso_providers", {
	id: uuid().notNull(),
	resourceId: text("resource_id"),
	createdAt: timestamp("created_at", { withTimezone: true, mode: 'string' }),
	updatedAt: timestamp("updated_at", { withTimezone: true, mode: 'string' }),
	disabled: boolean(),
}, (table) => [
	uniqueIndex("sso_providers_resource_id_idx").using("btree", sql`lower(resource_id)`),
	index("sso_providers_resource_id_pattern_idx").using("btree", table.resourceId.asc().nullsLast().op("text_pattern_ops")),
	check("resource_id not empty", sql`(resource_id = NULL::text) OR (char_length(resource_id) > 0)`),
]);

export const mfaFactorsInAuth = auth.table("mfa_factors", {
	id: uuid().notNull(),
	userId: uuid("user_id").notNull(),
	friendlyName: text("friendly_name"),
	factorType: factorTypeInAuth("factor_type").notNull(),
	status: factorStatusInAuth().notNull(),
	createdAt: timestamp("created_at", { withTimezone: true, mode: 'string' }).notNull(),
	updatedAt: timestamp("updated_at", { withTimezone: true, mode: 'string' }).notNull(),
	secret: text(),
	phone: text(),
	lastChallengedAt: timestamp("last_challenged_at", { withTimezone: true, mode: 'string' }),
	webAuthnCredential: jsonb("web_authn_credential"),
	webAuthnAaguid: uuid("web_authn_aaguid"),
	lastWebauthnChallengeData: jsonb("last_webauthn_challenge_data"),
}, (table) => [
	index("factor_id_created_at_idx").using("btree", table.userId.asc().nullsLast().op("timestamptz_ops"), table.createdAt.asc().nullsLast().op("uuid_ops")),
	uniqueIndex("mfa_factors_user_friendly_name_unique").using("btree", table.friendlyName.asc().nullsLast().op("text_ops"), table.userId.asc().nullsLast().op("uuid_ops")).where(sql`(TRIM(BOTH FROM friendly_name) <> ''::text)`),
	index("mfa_factors_user_id_idx").using("btree", table.userId.asc().nullsLast().op("uuid_ops")),
	uniqueIndex("unique_phone_factor_per_user").using("btree", table.userId.asc().nullsLast().op("text_ops"), table.phone.asc().nullsLast().op("text_ops")),
	foreignKey({
			columns: [table.userId],
			foreignColumns: [usersInAuth.id],
			name: "mfa_factors_user_id_fkey"
		}).onDelete("cascade"),
]);

export const oauthConsentsInAuth = auth.table("oauth_consents", {
	id: uuid().notNull(),
	userId: uuid("user_id").notNull(),
	clientId: uuid("client_id").notNull(),
	scopes: text().notNull(),
	grantedAt: timestamp("granted_at", { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
	revokedAt: timestamp("revoked_at", { withTimezone: true, mode: 'string' }),
}, (table) => [
	index("oauth_consents_active_client_idx").using("btree", table.clientId.asc().nullsLast().op("uuid_ops")).where(sql`(revoked_at IS NULL)`),
	index("oauth_consents_active_user_client_idx").using("btree", table.userId.asc().nullsLast().op("uuid_ops"), table.clientId.asc().nullsLast().op("uuid_ops")).where(sql`(revoked_at IS NULL)`),
	index("oauth_consents_user_order_idx").using("btree", table.userId.asc().nullsLast().op("timestamptz_ops"), table.grantedAt.desc().nullsFirst().op("timestamptz_ops")),
	foreignKey({
			columns: [table.clientId],
			foreignColumns: [oauthClientsInAuth.id],
			name: "oauth_consents_client_id_fkey"
		}).onDelete("cascade"),
	foreignKey({
			columns: [table.userId],
			foreignColumns: [usersInAuth.id],
			name: "oauth_consents_user_id_fkey"
		}).onDelete("cascade"),
	check("oauth_consents_revoked_after_granted", sql`(revoked_at IS NULL) OR (revoked_at >= granted_at)`),
	check("oauth_consents_scopes_length", sql`char_length(scopes) <= 2048`),
	check("oauth_consents_scopes_not_empty", sql`char_length(TRIM(BOTH FROM scopes)) > 0`),
]);

export const oauthAuthorizationsInAuth = auth.table("oauth_authorizations", {
	id: uuid().notNull(),
	authorizationId: text("authorization_id").notNull(),
	clientId: uuid("client_id").notNull(),
	userId: uuid("user_id"),
	redirectUri: text("redirect_uri").notNull(),
	scope: text().notNull(),
	state: text(),
	resource: text(),
	codeChallenge: text("code_challenge"),
	codeChallengeMethod: codeChallengeMethodInAuth("code_challenge_method"),
	responseType: oauthResponseTypeInAuth("response_type").default('code').notNull(),
	status: oauthAuthorizationStatusInAuth().default('pending').notNull(),
	authorizationCode: text("authorization_code"),
	createdAt: timestamp("created_at", { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
	expiresAt: timestamp("expires_at", { withTimezone: true, mode: 'string' }).default(sql`(now() + '00:03:00'::interval)`).notNull(),
	approvedAt: timestamp("approved_at", { withTimezone: true, mode: 'string' }),
	nonce: text(),
}, (table) => [
	index("oauth_auth_pending_exp_idx").using("btree", table.expiresAt.asc().nullsLast().op("timestamptz_ops")).where(sql`(status = 'pending'::auth.oauth_authorization_status)`),
	foreignKey({
			columns: [table.clientId],
			foreignColumns: [oauthClientsInAuth.id],
			name: "oauth_authorizations_client_id_fkey"
		}).onDelete("cascade"),
	foreignKey({
			columns: [table.userId],
			foreignColumns: [usersInAuth.id],
			name: "oauth_authorizations_user_id_fkey"
		}).onDelete("cascade"),
	check("oauth_authorizations_authorization_code_length", sql`char_length(authorization_code) <= 255`),
	check("oauth_authorizations_code_challenge_length", sql`char_length(code_challenge) <= 128`),
	check("oauth_authorizations_expires_at_future", sql`expires_at > created_at`),
	check("oauth_authorizations_nonce_length", sql`char_length(nonce) <= 255`),
	check("oauth_authorizations_redirect_uri_length", sql`char_length(redirect_uri) <= 2048`),
	check("oauth_authorizations_resource_length", sql`char_length(resource) <= 2048`),
	check("oauth_authorizations_scope_length", sql`char_length(scope) <= 4096`),
	check("oauth_authorizations_state_length", sql`char_length(state) <= 4096`),
]);

export const oauthClientStatesInAuth = auth.table("oauth_client_states", {
	id: uuid().notNull(),
	providerType: text("provider_type").notNull(),
	codeVerifier: text("code_verifier"),
	createdAt: timestamp("created_at", { withTimezone: true, mode: 'string' }).notNull(),
}, (table) => [
	index("idx_oauth_client_states_created_at").using("btree", table.createdAt.asc().nullsLast().op("timestamptz_ops")),
]);

export const oauthClientsInAuth = auth.table("oauth_clients", {
	id: uuid().notNull(),
	clientSecretHash: text("client_secret_hash"),
	registrationType: oauthRegistrationTypeInAuth("registration_type").notNull(),
	redirectUris: text("redirect_uris").notNull(),
	grantTypes: text("grant_types").notNull(),
	clientName: text("client_name"),
	clientUri: text("client_uri"),
	logoUri: text("logo_uri"),
	createdAt: timestamp("created_at", { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
	updatedAt: timestamp("updated_at", { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
	deletedAt: timestamp("deleted_at", { withTimezone: true, mode: 'string' }),
	clientType: oauthClientTypeInAuth("client_type").default('confidential').notNull(),
	tokenEndpointAuthMethod: text("token_endpoint_auth_method").notNull(),
}, (table) => [
	index("oauth_clients_deleted_at_idx").using("btree", table.deletedAt.asc().nullsLast().op("timestamptz_ops")),
	check("oauth_clients_client_name_length", sql`char_length(client_name) <= 1024`),
	check("oauth_clients_client_uri_length", sql`char_length(client_uri) <= 2048`),
	check("oauth_clients_logo_uri_length", sql`char_length(logo_uri) <= 2048`),
	check("oauth_clients_token_endpoint_auth_method_check", sql`token_endpoint_auth_method = ANY (ARRAY['client_secret_basic'::text, 'client_secret_post'::text, 'none'::text])`),
]);

export const customOauthProvidersInAuth = auth.table("custom_oauth_providers", {
	id: uuid().defaultRandom().notNull(),
	providerType: text("provider_type").notNull(),
	identifier: text().notNull(),
	name: text().notNull(),
	clientId: text("client_id").notNull(),
	clientSecret: text("client_secret").notNull(),
	acceptableClientIds: text("acceptable_client_ids").array().default([""]).notNull(),
	scopes: text().array().default([""]).notNull(),
	pkceEnabled: boolean("pkce_enabled").default(true).notNull(),
	attributeMapping: jsonb("attribute_mapping").default({}).notNull(),
	authorizationParams: jsonb("authorization_params").default({}).notNull(),
	enabled: boolean().default(true).notNull(),
	emailOptional: boolean("email_optional").default(false).notNull(),
	issuer: text(),
	discoveryUrl: text("discovery_url"),
	skipNonceCheck: boolean("skip_nonce_check").default(false).notNull(),
	cachedDiscovery: jsonb("cached_discovery"),
	discoveryCachedAt: timestamp("discovery_cached_at", { withTimezone: true, mode: 'string' }),
	authorizationUrl: text("authorization_url"),
	tokenUrl: text("token_url"),
	userinfoUrl: text("userinfo_url"),
	jwksUri: text("jwks_uri"),
	createdAt: timestamp("created_at", { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
	updatedAt: timestamp("updated_at", { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
	customClaimsAllowlist: text("custom_claims_allowlist").array().default([""]).notNull(),
}, (table) => [
	index("custom_oauth_providers_created_at_idx").using("btree", table.createdAt.asc().nullsLast().op("timestamptz_ops")),
	index("custom_oauth_providers_enabled_idx").using("btree", table.enabled.asc().nullsLast().op("bool_ops")),
	index("custom_oauth_providers_identifier_idx").using("btree", table.identifier.asc().nullsLast().op("text_ops")),
	index("custom_oauth_providers_provider_type_idx").using("btree", table.providerType.asc().nullsLast().op("text_ops")),
	check("custom_oauth_providers_authorization_url_https", sql`(authorization_url IS NULL) OR (authorization_url ~~ 'https://%'::text)`),
	check("custom_oauth_providers_authorization_url_length", sql`(authorization_url IS NULL) OR (char_length(authorization_url) <= 2048)`),
	check("custom_oauth_providers_client_id_length", sql`(char_length(client_id) >= 1) AND (char_length(client_id) <= 512)`),
	check("custom_oauth_providers_discovery_url_length", sql`(discovery_url IS NULL) OR (char_length(discovery_url) <= 2048)`),
	check("custom_oauth_providers_identifier_format", sql`identifier ~ '^[a-z0-9][a-z0-9:-]{0,48}[a-z0-9]$'::text`),
	check("custom_oauth_providers_issuer_length", sql`(issuer IS NULL) OR ((char_length(issuer) >= 1) AND (char_length(issuer) <= 2048))`),
	check("custom_oauth_providers_jwks_uri_https", sql`(jwks_uri IS NULL) OR (jwks_uri ~~ 'https://%'::text)`),
	check("custom_oauth_providers_jwks_uri_length", sql`(jwks_uri IS NULL) OR (char_length(jwks_uri) <= 2048)`),
	check("custom_oauth_providers_name_length", sql`(char_length(name) >= 1) AND (char_length(name) <= 100)`),
	check("custom_oauth_providers_oauth2_requires_endpoints", sql`(provider_type <> 'oauth2'::text) OR ((authorization_url IS NOT NULL) AND (token_url IS NOT NULL) AND (userinfo_url IS NOT NULL))`),
	check("custom_oauth_providers_oidc_discovery_url_https", sql`(provider_type <> 'oidc'::text) OR (discovery_url IS NULL) OR (discovery_url ~~ 'https://%'::text)`),
	check("custom_oauth_providers_oidc_issuer_https", sql`(provider_type <> 'oidc'::text) OR (issuer IS NULL) OR (issuer ~~ 'https://%'::text)`),
	check("custom_oauth_providers_oidc_requires_issuer", sql`(provider_type <> 'oidc'::text) OR (issuer IS NOT NULL)`),
	check("custom_oauth_providers_provider_type_check", sql`provider_type = ANY (ARRAY['oauth2'::text, 'oidc'::text])`),
	check("custom_oauth_providers_token_url_https", sql`(token_url IS NULL) OR (token_url ~~ 'https://%'::text)`),
	check("custom_oauth_providers_token_url_length", sql`(token_url IS NULL) OR (char_length(token_url) <= 2048)`),
	check("custom_oauth_providers_userinfo_url_https", sql`(userinfo_url IS NULL) OR (userinfo_url ~~ 'https://%'::text)`),
	check("custom_oauth_providers_userinfo_url_length", sql`(userinfo_url IS NULL) OR (char_length(userinfo_url) <= 2048)`),
]);

export const webauthnCredentialsInAuth = auth.table("webauthn_credentials", {
	id: uuid().defaultRandom().notNull(),
	userId: uuid("user_id").notNull(),
	// TODO: failed to parse database type 'bytea'
	credentialId: text("credential_id").notNull(),
	// TODO: failed to parse database type 'bytea'
	publicKey: text("public_key").notNull(),
	attestationType: text("attestation_type").default('').notNull(),
	aaguid: uuid(),
	// You can use { mode: "bigint" } if numbers are exceeding js number limitations
	signCount: bigint("sign_count", { mode: "number" }).default(0).notNull(),
	transports: jsonb().default([]).notNull(),
	backupEligible: boolean("backup_eligible").default(false).notNull(),
	backedUp: boolean("backed_up").default(false).notNull(),
	friendlyName: text("friendly_name").default('').notNull(),
	createdAt: timestamp("created_at", { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
	updatedAt: timestamp("updated_at", { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
	lastUsedAt: timestamp("last_used_at", { withTimezone: true, mode: 'string' }),
}, (table) => [
	uniqueIndex("webauthn_credentials_credential_id_key").using("btree", table.credentialId.asc().nullsLast().op("bytea_ops")),
	index("webauthn_credentials_user_id_idx").using("btree", table.userId.asc().nullsLast().op("uuid_ops")),
	foreignKey({
			columns: [table.userId],
			foreignColumns: [usersInAuth.id],
			name: "webauthn_credentials_user_id_fkey"
		}).onDelete("cascade"),
]);

export const webauthnChallengesInAuth = auth.table("webauthn_challenges", {
	id: uuid().defaultRandom().notNull(),
	userId: uuid("user_id"),
	challengeType: text("challenge_type").notNull(),
	sessionData: jsonb("session_data").notNull(),
	createdAt: timestamp("created_at", { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
	expiresAt: timestamp("expires_at", { withTimezone: true, mode: 'string' }).notNull(),
}, (table) => [
	index("webauthn_challenges_expires_at_idx").using("btree", table.expiresAt.asc().nullsLast().op("timestamptz_ops")),
	index("webauthn_challenges_user_id_idx").using("btree", table.userId.asc().nullsLast().op("uuid_ops")),
	foreignKey({
			columns: [table.userId],
			foreignColumns: [usersInAuth.id],
			name: "webauthn_challenges_user_id_fkey"
		}).onDelete("cascade"),
	check("webauthn_challenges_challenge_type_check", sql`challenge_type = ANY (ARRAY['signup'::text, 'registration'::text, 'authentication'::text])`),
]);

export const topicsInApp = app.table("topics", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	name: text().notNull(),
	slug: text().notNull(),
	createdAt: timestamp("created_at", { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
	updatedAt: timestamp("updated_at", { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
	isActive: boolean("is_active").default(true).notNull(),
}, (table) => [
	index("theory_categories_active_idx").using("btree", table.isActive.asc().nullsLast().op("bool_ops")).where(sql`(is_active = true)`),
	unique("topics_name_key").on(table.name),
	unique("topics_slug_key").on(table.slug),
	check("topics_name_check", sql`length(btrim(name)) > 0`),
	check("topics_slug_check", sql`length(btrim(slug)) > 0`),
]);

export const profilesInApp = app.table("profiles", {
	id: uuid().primaryKey().notNull(),
	displayName: text("display_name"),
	isAdmin: boolean("is_admin").default(false).notNull(),
	createdAt: timestamp("created_at", { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
	updatedAt: timestamp("updated_at", { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
}, (table) => [
	foreignKey({
			columns: [table.id],
			foreignColumns: [usersInAuth.id],
			name: "profiles_id_fkey"
		}).onDelete("cascade"),
]);

export const theoryQuestionsInApp = app.table("theory_questions", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	ownerProfileId: uuid("owner_profile_id"),
	sourceUrl: text("source_url"),
	isPublic: boolean("is_public").default(false).notNull(),
	question: text().notNull(),
	answer: jsonb().notNull(),
	createdAt: timestamp("created_at", { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
	updatedAt: timestamp("updated_at", { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
	sourceName: text("source_name"),
}, (table) => [
	index("theory_questions_owner_profile_id_idx").using("btree", table.ownerProfileId.asc().nullsLast().op("uuid_ops")),
	index("theory_questions_public_idx").using("btree", table.createdAt.desc().nullsFirst().op("timestamptz_ops")).where(sql`(is_public = true)`),
	foreignKey({
			columns: [table.ownerProfileId],
			foreignColumns: [profilesInApp.id],
			name: "theory_questions_owner_profile_id_fkey"
		}),
	check("theory_questions_question_check", sql`length(btrim(question)) > 0`),
]);

export const theoryAttemptsInApp = app.table("theory_attempts", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	profileId: uuid("profile_id").notNull(),
	questionId: uuid("question_id").notNull(),
	response: jsonb(),
	result: attemptResultInApp().notNull(),
	notes: jsonb(),
	createdAt: timestamp("created_at", { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
}, (table) => [
	index("theory_attempts_profile_question_created_at_idx").using("btree", table.profileId.asc().nullsLast().op("timestamptz_ops"), table.questionId.asc().nullsLast().op("timestamptz_ops"), table.createdAt.desc().nullsFirst().op("timestamptz_ops")),
	index("theory_attempts_question_id_idx").using("btree", table.questionId.asc().nullsLast().op("uuid_ops")),
	foreignKey({
			columns: [table.profileId],
			foreignColumns: [profilesInApp.id],
			name: "theory_attempts_profile_id_fkey"
		}).onDelete("cascade"),
	foreignKey({
			columns: [table.questionId],
			foreignColumns: [theoryQuestionsInApp.id],
			name: "theory_attempts_question_id_fkey"
		}),
]);

export const exerciseTopicsInApp = app.table("exercise_topics", {
	exerciseId: uuid("exercise_id").notNull(),
	topicId: uuid("topic_id").notNull(),
}, (table) => [
	index("exercise_topics_topic_id_idx").using("btree", table.topicId.asc().nullsLast().op("uuid_ops")),
	foreignKey({
			columns: [table.exerciseId],
			foreignColumns: [exercisesInApp.id],
			name: "exercise_topics_exercise_id_fkey"
		}).onDelete("cascade"),
	foreignKey({
			columns: [table.topicId],
			foreignColumns: [topicsInApp.id],
			name: "exercise_topics_topic_id_fkey"
		}),
	primaryKey({ columns: [table.exerciseId, table.topicId], name: "exercise_topics_pkey"}),
]);

export const theoryQuestionTopicsInApp = app.table("theory_question_topics", {
	questionId: uuid("question_id").notNull(),
	topicId: uuid("topic_id").notNull(),
}, (table) => [
	index("theory_question_categories_category_id_idx").using("btree", table.topicId.asc().nullsLast().op("uuid_ops")),
	foreignKey({
			columns: [table.questionId],
			foreignColumns: [theoryQuestionsInApp.id],
			name: "theory_question_topics_question_id_fkey"
		}).onDelete("cascade"),
	foreignKey({
			columns: [table.topicId],
			foreignColumns: [topicsInApp.id],
			name: "theory_question_topics_topic_id_fkey"
		}),
	primaryKey({ columns: [table.questionId, table.topicId], name: "theory_question_topics_pkey"}),
]);

export const exerciseLibraryItemsInApp = app.table("exercise_library_items", {
	profileId: uuid("profile_id").notNull(),
	exerciseId: uuid("exercise_id").notNull(),
	createdAt: timestamp("created_at", { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
}, (table) => [
	index("exercise_library_items_exercise_id_idx").using("btree", table.exerciseId.asc().nullsLast().op("uuid_ops")),
	foreignKey({
			columns: [table.exerciseId],
			foreignColumns: [exercisesInApp.id],
			name: "exercise_library_items_exercise_id_fkey"
		}).onDelete("cascade"),
	foreignKey({
			columns: [table.profileId],
			foreignColumns: [profilesInApp.id],
			name: "exercise_library_items_profile_id_fkey"
		}).onDelete("cascade"),
	primaryKey({ columns: [table.profileId, table.exerciseId], name: "exercise_library_items_pkey"}),
]);

export const theoryLibraryItemsInApp = app.table("theory_library_items", {
	profileId: uuid("profile_id").notNull(),
	questionId: uuid("question_id").notNull(),
	createdAt: timestamp("created_at", { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
}, (table) => [
	index("theory_library_items_question_id_idx").using("btree", table.questionId.asc().nullsLast().op("uuid_ops")),
	foreignKey({
			columns: [table.profileId],
			foreignColumns: [profilesInApp.id],
			name: "theory_library_items_profile_id_fkey"
		}).onDelete("cascade"),
	foreignKey({
			columns: [table.questionId],
			foreignColumns: [theoryQuestionsInApp.id],
			name: "theory_library_items_question_id_fkey"
		}).onDelete("cascade"),
	primaryKey({ columns: [table.profileId, table.questionId], name: "theory_library_items_pkey"}),
]);
