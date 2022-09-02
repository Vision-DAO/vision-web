import { useViewerRecord, ViewerRecord } from "@self.id/framework";
import { ModelTypeAliases } from "@glazed/types";
import { CoreModelTypes } from "@self.id/core";

// A model representing a ceramic record storing the items owned by the user
export type OwnedItemAddressesList = {
	items: string[];
};

// A model representing a ceramic record storing the items watched by the user
export type WatchedItemAddressesList = {
	items: string[];
};

// All model representations of ceramic models depended on by vision
export type ModelTypes =
	| ModelTypeAliases<
			{
				OwnedItemAddressesList: OwnedItemAddressesList;
				WatchedItemAddressesList: WatchedItemAddressesList;
			},
			{
				visionOwnedItemAddressesList: "OwnedItemAddressesList";
				visionWatchedItemAddressesList: "WatchedItemAddressesList";
			}
	  > &
			CoreModelTypes;

/**
 * Convenience types representing writable ceramic records for a user's
 * crypto accounts.
 */
export type OwnedIdeasRecord = ViewerRecord<OwnedItemAddressesList>;
export type WatchedIdeasRecord = ViewerRecord<WatchedItemAddressesList>;

/**
 * Write the given address to the list of owned crypto accounts stored in the
 * provided ceramic document.
 */
export const saveIdea = async (
	ideaAddr: string,
	record: OwnedIdeasRecord
): Promise<void> => {
	// TODO: Work on identifying cryptographic non-guarantees, and terminating this
	// non-null document link
	return await record.set({
		items: [...(record.content ? record.content.items : []), ideaAddr],
	});
};

/**
 * Write the given address to the list of watched crypto accounts stored in the
 * provided ceramic document.
 */
export const watchIdea = async (
	ideaAddr: string,
	record: WatchedIdeasRecord
): Promise<void> => {
	console.log(ideaAddr, record);
	// TODO: Work on identifying cryptographic non-guarantees, and terminating this
	// non-null document link
	return await record.set({
		items: [...(record.content ? record.content.items : []), ideaAddr],
	});
};

/**
 * Removed the given address to the list of watched crypto accounts stored in the
 * provided ceramic document.
 */
export const unwatchIdea = async (
	ideaAddr: string,
	record: WatchedIdeasRecord
): Promise<void> => {
	// TODO: Work on identifying cryptographic non-guarantees, and terminating this
	// non-null document link
	return await record.set({
		items: record.content?.items.filter((addr) => addr != ideaAddr) ?? [],
	});
};

/**
 * Gets a list of the addresses of idea contracts owned by the given
 * address from ceramic.
 */
export const useOwnedIdeas = (): Set<string> =>
	new Set(
		useViewerRecord<ModelTypes, "visionOwnedItemAddressesList">(
			"visionOwnedItemAddressesList"
		).content?.items ?? []
	);

/**
 * Gets a list of the addresses of idea contracts watched by the given
 * address from ceramic.
 */
export const useWatchedIdeas = (): Set<string> =>
	new Set(
		useViewerRecord<ModelTypes, "visionWatchedItemAddressesList">(
			"visionWatchedItemAddressesList"
		).content?.items ?? []
	);
