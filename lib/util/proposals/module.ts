import { createContext, Context } from "react";
import { PropInfoQuery, Sdk } from "../../../.graphclient";

export type PropInfo = PropInfoQuery["prop"];

export const ActiveProposalContext: Context<
	[PropInfo | undefined, (q: PropInfo | undefined) => void]
> = createContext(undefined);

/**
 * Pages visible in the window navigator for a proposal.
 */
export const pages = ["About"];

/**
 * Gets the title of the proposal.
 */
export const titleExtractor = (q: PropInfo): string => q.title;

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
