import { ModelManager } from "@glazed/devtools";
import { CeramicClient } from "@ceramicnetwork/http-client";
import { writeFile } from "node:fs/promises";
import { DID } from "dids";
import { Ed25519Provider } from "key-did-provider-ed25519";
import { getResolver } from "key-did-resolver";
import { fromString } from "uint8arrays";

if (!process.env.SEED) {
	throw new Error("Missing SEED environment variable");
}

const CERAMIC_URL = process.env.CERAMIC_URL || "https://ceramic-clay.3boxlabs.com";

// The seed must be provided as an environment variable
const seed = fromString(process.env.SEED, "base16");
// Create and authenticate the DID
const did = new DID({
	provider: new Ed25519Provider(seed),
	resolver: getResolver(),
});

await did.authenticate();

// Connect to the Ceramic node
const ceramic = new CeramicClient(CERAMIC_URL);
ceramic.did = did;


// Create a manager for the model
const manager = new ModelManager({ ceramic });

const watchedItemsSchemaID = await manager.createSchema("WatchedItemAddressesList", {
	"$schema": "http://json-schema.org/draft-07/schema#",
	"title": "WatchedItemAddressesList",
	"type": "object",
	"properties": {
		"watchedItems": {
			"type": "array",
			"title": "watchedItems",
			"items": {
				"type": "string"
			}
		}
	}
});

await manager.createDefinition("visionWatchedItemAddressesList", {
	name: "watchedItems",
	description: "A list of all the watched ideas",
	schema: manager.getSchemaURL(watchedItemsSchemaID),
});

// Create a Note with text that will be used as placeholder
await manager.createTile(
	"exampleWatched",
	{ text: "exampleWatched"},
	{ schema: manager.getSchemaURL(watchedItemsSchemaID) }
);


const modelAliases = await manager.deploy();
console.log(modelAliases);
