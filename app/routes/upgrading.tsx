import { json } from "@remix-run/node";
import type { LinksFunction, LoaderFunction } from "@remix-run/node";
import { Link, useLoaderData } from "@remix-run/react";

import Prism from "prismjs";
import darkThemeStylesHref from "prismjs/themes/prism-tomorrow.min.css";

export const links: LinksFunction = () => [
  {
    rel: "stylesheet",
    href: darkThemeStylesHref,
  },
];

export let loader: LoaderFunction = () => {
  return json({
    installReact: Prism.highlight(
      `npm install react react-dom`,
      Prism.languages.plain,
      "plain"
    ),
    entryClient: Prism.highlight(
      `import { hydrateRoot } from "react-dom/client";
import { RemixBrowser } from "@remix-run/react";

hydrateRoot(document, <RemixBrowser />);`,
      Prism.languages.js,
      "js"
    ),
    entryServer: Prism.highlight(
      `import { PassThrough } from "stream";
import { renderToPipeableStream } from "react-dom/server";
import { RemixServer } from "@remix-run/react";
import type { EntryContext } from "@remix-run/node";
import { Response, Headers } from "@remix-run/node";
import isbot from "isbot";

const ABORT_DELAY = 5000;

export default function handleRequest(
  request: Request,
  responseStatusCode: number,
  responseHeaders: Headers,
  remixContext: EntryContext
) {
  const callbackName = isbot(request.headers.get("user-agent"))
    ? "onAllReady"
    : "onShellReady";

  return new Promise((resolve, reject) => {
    let didError = false;

    const { pipe, abort } = renderToPipeableStream(
      <RemixServer context={remixContext} url={request.url} />,
      {
        [callbackName]() {
          let body = new PassThrough();

          responseHeaders.set("Content-Type", "text/html");

          resolve(
            new Response(body, {
              status: didError ? 500 : responseStatusCode,
              headers: responseHeaders,
            })
          );
          pipe(body);
        },
        onShellError(err) {
          reject(err);
        },
        onError(error) {
          didError = true;
          console.error(error);
        },
      }
    );
    setTimeout(abort, ABORT_DELAY);
  });
}`,
      Prism.languages.js,
      "js"
    ),
  });
};

export default function Upgrading() {
  let { installReact, entryClient, entryServer } = useLoaderData();
  console.log(installReact);
  return (
    <main className="container">
      <h1>Upgrading to React 18</h1>
      <p>To start, all you have to do is install React 18:</p>

      <pre>
        <code dangerouslySetInnerHTML={{ __html: installReact }} />
      </pre>

      <br />

      <p>
        This will get you running right away, but you will be missing out on
        some of React 18's best features until you update your{" "}
        <code>entry.client</code>
        and <code>entry.server</code>.
      </p>

      <p>
        <code>entry.client</code> will need to be updated to use the new{" "}
        <code>hydrateRoot</code> API:
      </p>

      <pre>
        <code dangerouslySetInnerHTML={{ __html: entryClient }} />
      </pre>

      <br />

      <p>
        <code>entry.server</code> will need to be updated to use the new{" "}
        <code>renderToPipeableStream</code> API. This is a bit more involved
        than <code>renderToString</code> but isn't terrible:
      </p>

      <pre>
        <code dangerouslySetInnerHTML={{ __html: entryServer }} />
      </pre>

      <br />

      <p>
        That's it! You are now streaming your HTML responses and are ready to
        use new features available on the server such as{" "}
        <Link to="/lazy">
          <code>React.lazy</code>
        </Link>
      </p>
    </main>
  );
}
