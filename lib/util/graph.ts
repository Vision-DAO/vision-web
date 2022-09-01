import { UserStatsQuery, UserFeedQuery } from "../../.graphclient";

/**
 * The representation of a DAO extracted from user feeds.
 */
export type UserFeedDaoRepr =
	UserFeedQuery["user"]["ideas"][0]["tokens"]["dao"];

async function* yieldThing<T>(thing: T) {
	yield thing;
}

async function* yieldNothing() {}

/**
 * Creates an iterator over the single given element, or returns the element
 * if it is an iterator itself.
 */
export const orSingleIter = <T>(
	v: null | AsyncIterable<T> | T
): AsyncIterable<T> => {
	if (v === null) return yieldNothing();
	if (Symbol.iterator in Object(v)) return v as AsyncIterable<T>;

	const val = <T>v;
	return yieldThing<T>(val);
};

/**
 * Gets the VIS balance of a user from their stats.
 */
export const getVisBalance = (q: UserStatsQuery, visAddr: string): number =>
	q.user?.ideas.find((idea) => idea.dao.id === visAddr)?.tokens.balance ?? 0;
