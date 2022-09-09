import { GetDaoAboutQuery, Sdk, Scalars } from "../../../.graphclient";
import { Context, createContext } from "react";

/**
 * Represents the current idea selected by a page.
 */
export const ActiveIdeaContext: Context<
	[
		GetDaoAboutQuery["idea"] | undefined,
		(q: GetDaoAboutQuery["idea"] | undefined) => void
	]
> = createContext(undefined);

/**
 * The list of pages that are navigable inside an idea.
 */
export const pages = ["About", "Proposals"];

/**
 * Gets the title of the DAO.
 */
export const titleExtractor = (q: GetDaoAboutQuery["idea"]): string => q.name;

/**
 * Fed into the IdeaNavigator wrapper. Loads event information about an idea.
 */
export async function* loader(graph: Sdk, addr: string) {
	const day = new Date();

	day.setUTCHours(0, 0, 0, 0);

	const stream = await (graph.GetDaoAbout({
		id: addr,
		dayStart: Math.floor(day.getTime() / 1000) as unknown as Scalars["BigInt"],
	}) as unknown as Promise<AsyncIterable<GetDaoAboutQuery>>);

	let loaded = false;

	for await (const val of stream) {
		if (val.idea || !loaded) yield val.idea ?? null;

		loaded = true;
	}
}
