import { styled } from "@mui/material/styles";
import Slider, { SliderProps } from "@mui/material/Slider";

/**
 * An MUI slider with Vision colors.
 */
export const StyledSlider = styled(Slider)<SliderProps>(() => ({
	"& .MuiSlider-thumb": {
		backgroundColor: "#5D5FEF",
	},
	"& .MuiSlider-valueLabelOpen": {
		zIndex: "5",
	},
	"& .MuiSlider-track": {
		backgroundColor: "rgba(93, 95, 239, 0.75)",
	},
	'& .MuiSlider-markLabel[data-index="0"]': {
		transform: "translateX(0%)",
	},
	'& .MuiSlider-markLabel[data-index="1"]': {
		transform: "translateX(-100%)",
	},
}));
