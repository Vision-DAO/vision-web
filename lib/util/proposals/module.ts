import { createContext, Context } from "react";
import { PropInfoQuery, Sdk } from "../../../.graphclient";

export const ActiveProposalContext: Context<
	[
		PropInfoQuery["prop"] | undefined,
		(q: PropInfoQuery["prop"] | undefined) => void
	]
> = createContext(undefined);

/**
 * Pages visible in the window navigator for a proposal.
 */
export const pages = ["About"];

/**
 * Gets the title of the proposal.
 */
export const titleExtractor = (q: PropInfoQuery["prop"]): string => q.title;

/**
 * Fed into the Navigator wrapper. Loads basic, and extended proposal information, in succession.
 */
export async function* loader(graph: Sdk, addr: string) {
	const stream = await (graph.PropInfo({ id: addr }) as unknown as Promise<
		AsyncIterable<PropInfoQuery>
	>);

	for await (const val of stream) {
		yield val.prop ?? null;
	}
}
