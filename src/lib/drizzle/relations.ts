import { relations } from "drizzle-orm/relations";
import { flowStateInAuth, samlRelayStatesInAuth, ssoProvidersInAuth, samlProvidersInAuth, sessionsInAuth, refreshTokensInAuth, ssoDomainsInAuth, mfaAmrClaimsInAuth, usersInAuth, identitiesInAuth, oneTimeTokensInAuth, oauthClientsInAuth, mfaFactorsInAuth, mfaChallengesInAuth, oauthConsentsInAuth, oauthAuthorizationsInAuth, webauthnCredentialsInAuth, webauthnChallengesInAuth, profilesInApp, theoryAttemptsInApp, theoryQuestionsInApp, theoryCategoriesInApp, theoryQuestionCategoriesInApp, theoryLibraryItemsInApp } from "./schema";

export const samlRelayStatesInAuthRelations = relations(samlRelayStatesInAuth, ({one}) => ({
	flowStateInAuth: one(flowStateInAuth, {
		fields: [samlRelayStatesInAuth.flowStateId],
		references: [flowStateInAuth.id]
	}),
	ssoProvidersInAuth: one(ssoProvidersInAuth, {
		fields: [samlRelayStatesInAuth.ssoProviderId],
		references: [ssoProvidersInAuth.id]
	}),
}));

export const flowStateInAuthRelations = relations(flowStateInAuth, ({many}) => ({
	samlRelayStatesInAuths: many(samlRelayStatesInAuth),
}));

export const ssoProvidersInAuthRelations = relations(ssoProvidersInAuth, ({many}) => ({
	samlRelayStatesInAuths: many(samlRelayStatesInAuth),
	samlProvidersInAuths: many(samlProvidersInAuth),
	ssoDomainsInAuths: many(ssoDomainsInAuth),
}));

export const samlProvidersInAuthRelations = relations(samlProvidersInAuth, ({one}) => ({
	ssoProvidersInAuth: one(ssoProvidersInAuth, {
		fields: [samlProvidersInAuth.ssoProviderId],
		references: [ssoProvidersInAuth.id]
	}),
}));

export const refreshTokensInAuthRelations = relations(refreshTokensInAuth, ({one}) => ({
	sessionsInAuth: one(sessionsInAuth, {
		fields: [refreshTokensInAuth.sessionId],
		references: [sessionsInAuth.id]
	}),
}));

export const sessionsInAuthRelations = relations(sessionsInAuth, ({one, many}) => ({
	refreshTokensInAuths: many(refreshTokensInAuth),
	mfaAmrClaimsInAuths: many(mfaAmrClaimsInAuth),
	oauthClientsInAuth: one(oauthClientsInAuth, {
		fields: [sessionsInAuth.oauthClientId],
		references: [oauthClientsInAuth.id]
	}),
	usersInAuth: one(usersInAuth, {
		fields: [sessionsInAuth.userId],
		references: [usersInAuth.id]
	}),
}));

export const ssoDomainsInAuthRelations = relations(ssoDomainsInAuth, ({one}) => ({
	ssoProvidersInAuth: one(ssoProvidersInAuth, {
		fields: [ssoDomainsInAuth.ssoProviderId],
		references: [ssoProvidersInAuth.id]
	}),
}));

export const mfaAmrClaimsInAuthRelations = relations(mfaAmrClaimsInAuth, ({one}) => ({
	sessionsInAuth: one(sessionsInAuth, {
		fields: [mfaAmrClaimsInAuth.sessionId],
		references: [sessionsInAuth.id]
	}),
}));

export const identitiesInAuthRelations = relations(identitiesInAuth, ({one}) => ({
	usersInAuth: one(usersInAuth, {
		fields: [identitiesInAuth.userId],
		references: [usersInAuth.id]
	}),
}));

export const usersInAuthRelations = relations(usersInAuth, ({many}) => ({
	identitiesInAuths: many(identitiesInAuth),
	oneTimeTokensInAuths: many(oneTimeTokensInAuth),
	sessionsInAuths: many(sessionsInAuth),
	mfaFactorsInAuths: many(mfaFactorsInAuth),
	oauthConsentsInAuths: many(oauthConsentsInAuth),
	oauthAuthorizationsInAuths: many(oauthAuthorizationsInAuth),
	webauthnCredentialsInAuths: many(webauthnCredentialsInAuth),
	webauthnChallengesInAuths: many(webauthnChallengesInAuth),
	profilesInApps: many(profilesInApp),
}));

export const oneTimeTokensInAuthRelations = relations(oneTimeTokensInAuth, ({one}) => ({
	usersInAuth: one(usersInAuth, {
		fields: [oneTimeTokensInAuth.userId],
		references: [usersInAuth.id]
	}),
}));

export const oauthClientsInAuthRelations = relations(oauthClientsInAuth, ({many}) => ({
	sessionsInAuths: many(sessionsInAuth),
	oauthConsentsInAuths: many(oauthConsentsInAuth),
	oauthAuthorizationsInAuths: many(oauthAuthorizationsInAuth),
}));

export const mfaChallengesInAuthRelations = relations(mfaChallengesInAuth, ({one}) => ({
	mfaFactorsInAuth: one(mfaFactorsInAuth, {
		fields: [mfaChallengesInAuth.factorId],
		references: [mfaFactorsInAuth.id]
	}),
}));

export const mfaFactorsInAuthRelations = relations(mfaFactorsInAuth, ({one, many}) => ({
	mfaChallengesInAuths: many(mfaChallengesInAuth),
	usersInAuth: one(usersInAuth, {
		fields: [mfaFactorsInAuth.userId],
		references: [usersInAuth.id]
	}),
}));

export const oauthConsentsInAuthRelations = relations(oauthConsentsInAuth, ({one}) => ({
	oauthClientsInAuth: one(oauthClientsInAuth, {
		fields: [oauthConsentsInAuth.clientId],
		references: [oauthClientsInAuth.id]
	}),
	usersInAuth: one(usersInAuth, {
		fields: [oauthConsentsInAuth.userId],
		references: [usersInAuth.id]
	}),
}));

export const oauthAuthorizationsInAuthRelations = relations(oauthAuthorizationsInAuth, ({one}) => ({
	oauthClientsInAuth: one(oauthClientsInAuth, {
		fields: [oauthAuthorizationsInAuth.clientId],
		references: [oauthClientsInAuth.id]
	}),
	usersInAuth: one(usersInAuth, {
		fields: [oauthAuthorizationsInAuth.userId],
		references: [usersInAuth.id]
	}),
}));

export const webauthnCredentialsInAuthRelations = relations(webauthnCredentialsInAuth, ({one}) => ({
	usersInAuth: one(usersInAuth, {
		fields: [webauthnCredentialsInAuth.userId],
		references: [usersInAuth.id]
	}),
}));

export const webauthnChallengesInAuthRelations = relations(webauthnChallengesInAuth, ({one}) => ({
	usersInAuth: one(usersInAuth, {
		fields: [webauthnChallengesInAuth.userId],
		references: [usersInAuth.id]
	}),
}));

export const theoryAttemptsInAppRelations = relations(theoryAttemptsInApp, ({one}) => ({
	profilesInApp: one(profilesInApp, {
		fields: [theoryAttemptsInApp.profileId],
		references: [profilesInApp.id]
	}),
	theoryQuestionsInApp: one(theoryQuestionsInApp, {
		fields: [theoryAttemptsInApp.questionId],
		references: [theoryQuestionsInApp.id]
	}),
}));

export const profilesInAppRelations = relations(profilesInApp, ({one, many}) => ({
	theoryAttemptsInApps: many(theoryAttemptsInApp),
	usersInAuth: one(usersInAuth, {
		fields: [profilesInApp.id],
		references: [usersInAuth.id]
	}),
	theoryQuestionsInApps: many(theoryQuestionsInApp),
	theoryLibraryItemsInApps: many(theoryLibraryItemsInApp),
}));

export const theoryQuestionsInAppRelations = relations(theoryQuestionsInApp, ({one, many}) => ({
	theoryAttemptsInApps: many(theoryAttemptsInApp),
	profilesInApp: one(profilesInApp, {
		fields: [theoryQuestionsInApp.ownerProfileId],
		references: [profilesInApp.id]
	}),
	theoryQuestionCategoriesInApps: many(theoryQuestionCategoriesInApp),
	theoryLibraryItemsInApps: many(theoryLibraryItemsInApp),
}));

export const theoryQuestionCategoriesInAppRelations = relations(theoryQuestionCategoriesInApp, ({one}) => ({
	theoryCategoriesInApp: one(theoryCategoriesInApp, {
		fields: [theoryQuestionCategoriesInApp.categoryId],
		references: [theoryCategoriesInApp.id]
	}),
	theoryQuestionsInApp: one(theoryQuestionsInApp, {
		fields: [theoryQuestionCategoriesInApp.questionId],
		references: [theoryQuestionsInApp.id]
	}),
}));

export const theoryCategoriesInAppRelations = relations(theoryCategoriesInApp, ({many}) => ({
	theoryQuestionCategoriesInApps: many(theoryQuestionCategoriesInApp),
}));

export const theoryLibraryItemsInAppRelations = relations(theoryLibraryItemsInApp, ({one}) => ({
	profilesInApp: one(profilesInApp, {
		fields: [theoryLibraryItemsInApp.profileId],
		references: [profilesInApp.id]
	}),
	theoryQuestionsInApp: one(theoryQuestionsInApp, {
		fields: [theoryLibraryItemsInApp.questionId],
		references: [theoryQuestionsInApp.id]
	}),
}));