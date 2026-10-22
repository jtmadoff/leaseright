import { createContext, useContext } from "react";
import { localToday } from "../core/format.js";

/** The project's today, provided by the project shell: the simulation clock or the calendar. */
export const ClockContext = createContext(null);
export const useToday = () => useContext(ClockContext) || localToday();
