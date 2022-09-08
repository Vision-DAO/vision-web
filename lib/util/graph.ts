import {
	UserStatsQuery,
	UserFeedQuery,
	GetDaoInfoQuery,
	Sdk,
} from "../../.graphclient";
import { useState, useContext, useEffect, createContext } from "react";

/**
 * Global instance of The Graph client.
 */
export const ClientContext = createContext<Sdk>(undefined);

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
	streamBuilder: (client: Sdk) => Promise<AsyncIterable<T>>,
	deps: unknown[],
	extractorKey?: string
): T => {
	const graph = useGraph();
	const [v, setV] = useState(init);

	useEffect(() => {
		(async () => {
			const stream = await streamBuilder(graph);

			if (stream === undefined) return;

			for await (const entry of stream) {
				if (!extractorKey || extractorKey in entry) setV(entry);
			}
		})();
	}, deps);

	if (v === undefined) return init;

	return v;
};

export const useGraph = (): Sdk => {
	return useContext(ClientContext);
};
