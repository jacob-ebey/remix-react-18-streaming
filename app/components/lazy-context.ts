import { createContext } from "react";

export let Context = createContext<{ promise: Promise<void> | null }>({
  promise: null,
});
