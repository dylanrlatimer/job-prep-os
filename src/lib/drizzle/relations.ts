import { relations } from "drizzle-orm/relations";
import { profilesInApp, exercisesInApp, flowStateInAuth, samlRelayStatesInAuth, ssoProvidersInAuth, samlProvidersInAuth, exerciseChoicesInApp, exerciseAttemptsInApp, sessionsInAuth, refreshTokensInAuth, ssoDomainsInAuth, mfaAmrClaimsInAuth, usersInAuth, identitiesInAuth, oneTimeTokensInAuth, oauthClientsInAuth, mfaFactorsInAuth, mfaChallengesInAuth, oauthConsentsInAuth, oauthAuthorizationsInAuth, webauthnCredentialsInAuth, webauthnChallengesInAuth, theoryQuestionsInApp, theoryAttemptsInApp, exerciseTopicsInApp, topicsInApp, theoryQuestionTopicsInApp, exerciseLibraryItemsInApp, theoryLibraryItemsInApp } from "./schema";

export const exercisesInAppRelations = relations(exercisesInApp, ({one, many}) => ({
	profilesInApp: one(profilesInApp, {
		fields: [exercisesInApp.ownerProfileId],
		references: [profilesInApp.id]
	}),
	exerciseChoicesInApps: many(exerciseChoicesInApp),
	exerciseAttemptsInApps: many(exerciseAttemptsInApp),
	exerciseTopicsInApps: many(exerciseTopicsInApp),
	exerciseLibraryItemsInApps: many(exerciseLibraryItemsInApp),
}));

export const profilesInAppRelations = relations(profilesInApp, ({one, many}) => ({
	exercisesInApps: many(exercisesInApp),
	exerciseAttemptsInApps: many(exerciseAttemptsInApp),
	usersInAuth: one(usersInAuth, {
		fields: [profilesInApp.id],
		references: [usersInAuth.id]
	}),
	theoryQuestionsInApps: many(theoryQuestionsInApp),
	theoryAttemptsInApps: many(theoryAttemptsInApp),
	exerciseLibraryItemsInApps: many(exerciseLibraryItemsInApp),
	theoryLibraryItemsInApps: many(theoryLibraryItemsInApp),
}));

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

export const exerciseChoicesInAppRelations = relations(exerciseChoicesInApp, ({one}) => ({
	exercisesInApp: one(exercisesInApp, {
		fields: [exerciseChoicesInApp.exerciseId],
		references: [exercisesInApp.id]
	}),
}));

export const exerciseAttemptsInAppRelations = relations(exerciseAttemptsInApp, ({one}) => ({
	exercisesInApp: one(exercisesInApp, {
		fields: [exerciseAttemptsInApp.exerciseId],
		references: [exercisesInApp.id]
	}),
	profilesInApp: one(profilesInApp, {
		fields: [exerciseAttemptsInApp.profileId],
		references: [profilesInApp.id]
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

export const theoryQuestionsInAppRelations = relations(theoryQuestionsInApp, ({one, many}) => ({
	profilesInApp: one(profilesInApp, {
		fields: [theoryQuestionsInApp.ownerProfileId],
		references: [profilesInApp.id]
	}),
	theoryAttemptsInApps: many(theoryAttemptsInApp),
	theoryQuestionTopicsInApps: many(theoryQuestionTopicsInApp),
	theoryLibraryItemsInApps: many(theoryLibraryItemsInApp),
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

export const exerciseTopicsInAppRelations = relations(exerciseTopicsInApp, ({one}) => ({
	exercisesInApp: one(exercisesInApp, {
		fields: [exerciseTopicsInApp.exerciseId],
		references: [exercisesInApp.id]
	}),
	topicsInApp: one(topicsInApp, {
		fields: [exerciseTopicsInApp.topicId],
		references: [topicsInApp.id]
	}),
}));

export const topicsInAppRelations = relations(topicsInApp, ({many}) => ({
	exerciseTopicsInApps: many(exerciseTopicsInApp),
	theoryQuestionTopicsInApps: many(theoryQuestionTopicsInApp),
}));

export const theoryQuestionTopicsInAppRelations = relations(theoryQuestionTopicsInApp, ({one}) => ({
	theoryQuestionsInApp: one(theoryQuestionsInApp, {
		fields: [theoryQuestionTopicsInApp.questionId],
		references: [theoryQuestionsInApp.id]
	}),
	topicsInApp: one(topicsInApp, {
		fields: [theoryQuestionTopicsInApp.topicId],
		references: [topicsInApp.id]
	}),
}));

export const exerciseLibraryItemsInAppRelations = relations(exerciseLibraryItemsInApp, ({one}) => ({
	exercisesInApp: one(exercisesInApp, {
		fields: [exerciseLibraryItemsInApp.exerciseId],
		references: [exercisesInApp.id]
	}),
	profilesInApp: one(profilesInApp, {
		fields: [exerciseLibraryItemsInApp.profileId],
		references: [profilesInApp.id]
	}),
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