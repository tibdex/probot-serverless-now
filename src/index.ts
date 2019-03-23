import { ClientRequest, ServerResponse } from "http";

import { ApplicationFunction } from "probot";
import sentryApp from "probot/lib/apps/sentry";
import { logRequestErrors } from "probot/lib/middleware/log-request-errors";

import { getLandingPage } from "./landing-page";
import { createProbot, fetchAppName } from "./utils";

type RequestHandler = (
  request: ClientRequest,
  response: ServerResponse,
) => void;

const initializeProbot = (applicationFn: ApplicationFunction) => {
  const probot = createProbot();

  // Log all unhandled rejections
  process.on("unhandledRejection", probot.errorHandler as any);

  const application = probot.load(applicationFn);
  probot.load(sentryApp);

  probot.server.use(logRequestErrors);

  application
    .route("/")
    .get(
      "/",
      async (
        internalRequest: ClientRequest,
        internalResponse: ServerResponse,
      ) => {
        const name = await fetchAppName(application);
        internalResponse.statusCode = 200;
        internalResponse.end(getLandingPage(name));
      },
    );

  return probot;
};

/**
 * Wrap the given application function as a lambda.
 *
 * @param applicationFn - The function corresponding to this GitHub App.
 */
const toLambda = (applicationFn: ApplicationFunction): RequestHandler =>
  initializeProbot(applicationFn).server;

export { toLambda };
