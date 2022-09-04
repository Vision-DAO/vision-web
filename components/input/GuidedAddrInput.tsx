import { useStream } from "../../lib/util/graph";
import { useProfiles } from "../../lib/util/ipfs";
import { BasicProfile } from "@datamodels/identity-profile-basic";
import {
	GetAllUsersQuery,
	GetAllUsersDocument,
	SearchQuery,
	SearchDocument,
	execute,
} from "../../.graphclient";
import { UnderlinedInput } from "./UnderlinedInput";
import { Autocomplete } from "@mui/material";
import { useState, useEffect } from "react";
import { AutocompleteRenderInputParams } from "@mui/material";

/**
 * An input that displays users, and DAO's to select from.
 */
export const GuidedAddrInput = ({
	onChange,
	className,
}: {
	onChange: (addr: string) => void;
	className?: string;
}) => {
	// Used for finding recipients of a transaction
	const users = useStream<GetAllUsersQuery>(
		{ users: [] },
		GetAllUsersDocument,
		{}
	);
	const profiles = useProfiles(users.users.map((user) => user.id));
	const profileOptions = Object.entries(profiles)
		.filter(([, profile]) => profile.name)
		.map(([addr, profile]: [string, BasicProfile]) => {
			return { label: profile.name, id: addr };
		});

	const [daoOptions, setDaoOptions] = useState<[{ label: string; id: string }]>(
		[]
	);
	const [queuedQuery, setQueuedQuery] = useState(null);
	const options = [...profileOptions, ...daoOptions];

	const [value, setValue] = useState<string>("");
	const [option, setOption] = useState<string>("");

	// Get all of the DAO's that match the criteria
	useEffect(() => {
		(async () => {
			if (queuedQuery !== null) clearTimeout(queuedQuery);

			setQueuedQuery(
				setTimeout(async () => {
					const res = await execute(SearchDocument, {
						text: value.replaceAll(" ", " & "),
					});

					if (res.data === null) return;

					setDaoOptions(
						res.data.ideaPropSearch.map(
							(idea: SearchQuery["ideaPropSearch"][0]) => {
								return { label: idea.name, id: idea.id };
							}
						)
					);
				}, 1000)
			);
		})();
	}, [value.length]);

	const renderInput = ({
		InputProps: { ref },

		// Ignore this: MUI didn't add ref here, but they pass it to you anyway bc trolling
		inputProps: { onClick, ref: innerRef, ...inputProps },
	}: AutocompleteRenderInputParams) => {
		const handler: (v: string) => void = (v: string) => {
			setValue(v);
			onChange(v);
		};

		return (
			<div ref={ref} className={className}>
				<UnderlinedInput
					className={className}
					placeholder="0xABCDEF"
					startingValue=""
					innerRef={innerRef}
					{...inputProps}
					onChange={handler as (v: string) => void}
				/>
			</div>
		);
	};

	return (
		<Autocomplete
			freeSolo
			inputValue={value}
			value={option}
			onChange={(_, value) => {
				if (typeof value === "string") {
					return;
				}

				onChange(value.id);
				setValue(value.id);
				setOption(value.label);
			}}
			options={options}
			renderInput={renderInput}
			sx={{ width: "100%" }}
		/>
	);
};
