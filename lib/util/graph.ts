import {
	UserStatsQuery,
	UserFeedQuery,
	GetDaoInfoQuery,
	subscribe,
} from "../../.graphclient";
import { useState, useEffect } from "react";

/**
 * The representation of a DAO extracted from user feeds.
 */
export type UserFeedDaoRepr =
	UserFeedQuery["user"]["ideas"][0]["tokens"]["dao"];

/**
 * The representation of the stats of a DAO.
 */
export type DAOStatsRepr = GetDaoInfoQuery["idea"];

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

/**
 * Subscibes to a stream from The Graph, yielding continuous results.
 */
export const useStream = <T>(
	init: T,
	...params: Parameters<typeof subscribe>
): T => {
	const [v, setV] = useState(init);

	useEffect(
		() => {
			if ("id" in params[1] && params[1]["id"] === undefined) {
				setV(init);

				return;
			}

			(async () => {
				const stream = await subscribe(...params);

				for await (const entry of orSingleIter(stream)) {
					if (entry.data === null) return;

					setV(entry.data);
				}
			})();
		},
		"id" in params[1] ? [params[1]["id"]] : []
	);

	if (v === undefined) return init;

	return v;
};
