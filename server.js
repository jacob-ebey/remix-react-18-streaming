const express = require("express");
const compression = require("compression");
const morgan = require("morgan");
const { createRequestHandler } = require("@remix-run/express");
const { createRoutes } = require("@remix-run/server-runtime/routes");
const {
  matchServerRoutes,
} = require("@remix-run/server-runtime/routeMatching");

const buildPath = "./build";

const app = express();

// http://expressjs.com/en/advanced/best-practice-security.html#at-a-minimum-disable-x-powered-by-header
app.disable("x-powered-by");

app.use(
  compression({
    filter: (req) => {
      // disable compression for document requests to allow chunked streaming
      if (
        req.headers["accept"] &&
        req.headers["accept"].indexOf("text/html") !== -1
      ) {
        return false;
      }
    },
  })
);

// Remix fingerprints its assets so we can cache forever.
app.use(
  "/build",
  express.static("public/build", { immutable: true, maxAge: "1y" })
);

// Everything else (like favicon.ico) is cached for an hour. You may want to be
// more aggressive with this caching.
app.use(express.static("public", { maxAge: "1h" }));

app.use(morgan("tiny"));

app.all(
  "*",
  ...(process.env.NODE_ENV === "development"
    ? [
        (req, res, next) => {
          purgeRequireCache(buildPath);

          remixEarlyHints(require(buildPath))(req, res);
          return createRequestHandler({
            build: require(buildPath),
            mode: process.env.NODE_ENV,
          })(req, res, next);
        },
      ]
    : [
        remixEarlyHints(require(buildPath)),
        createRequestHandler({
          build: require(buildPath),
          mode: process.env.NODE_ENV,
        }),
      ])
);
const port = process.env.PORT || 3000;

app.listen(port, () => {
  console.log(`Express server listening on port ${port}`);
});

function purgeRequireCache(path) {
  delete require.cache[require.resolve(path)];
}

function remixEarlyHints(build) {
  function getRel(resource) {
    if (resource.endsWith(".js")) {
      return "modulepreload";
    }
    return "preload";
  }

  const routes = createRoutes(build.routes);

  return (req, res, next) => {
    const matches = matchServerRoutes(routes, req.path);

    let resources =
      matches &&
      matches.flatMap((match) => [
        build.assets.routes[match.route.id].module,
        ...(build.assets.routes[match.route.id].imports || []),
      ]);

    if (resources && resources.length > 0) {
      res.connection.write("HTTP/1.1 103 Early Hints\r\n");
      for (const resource of resources) {
        res.connection.write(
          `Link: <${resource}>; rel=${getRel(resource)}\r\n`
        );
      }
      res.connection.write("\r\n");
    }

    if (next) next();
  };
}
