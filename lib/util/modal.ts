import { createContext, ReactElement } from "react";

/**
 * Contains a global instance of the currently used modal item.
 */
export const ModalContext: React.Context<[ReactElement, (elem: ReactElement) => void]> = createContext(undefined);
