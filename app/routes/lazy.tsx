import { useMemo } from "react";
import { lazy, Suspense } from "react";

import { Context } from "~/components/lazy-context";
let LazyComponent = lazy(() => import("~/components/lazy"));

export default function Lazy() {
  let delay = useMemo<{ promise: Promise<void> | null }>(
    () => ({
      promise: new Promise<void>((resolve) => setTimeout(resolve, 1000)).then(
        () => {
          delay.promise = null;
        }
      ),
    }),
    []
  );

  return (
    <>
      <main className="container">
        <h1>React.lazy</h1>
        <p>
          Everything below here is lazy loaded with an artificial delay but
          still SSR'd and streamed down.
        </p>
        <hr />
      </main>
      <Context.Provider value={delay}>
        <Suspense
          fallback={
            <div className="container">
              <p>Loading...</p>
            </div>
          }
        >
          <LazyComponent />
        </Suspense>
      </Context.Provider>
    </>
  );
}
