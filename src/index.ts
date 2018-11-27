/* tslint:disable:no-console */
import { IncomingMessage, ServerResponse } from "http";

import { Application, ApplicationFunction, createProbot, Probot } from "probot";
import * as sentryApp from "probot/lib/apps/sentry";
import * as logRequestErrors from "probot/lib/middleware/log-request-errors";
import { findPrivateKey } from "probot/lib/private-key";

import getLandingPage from "./landing-page";
import { fetchAppName } from "./utils";

const options = {
  cert: String(findPrivateKey()),
  id: Number(process.env.APP_ID),
  port: 3000,
  secret: process.env.WEBHOOK_SECRET,
};

// tslint:disable-next-line:variable-name
const _createProbotAndLoadApplication = (
  applicationFn: ApplicationFunction,
): {
  application: Application;
  probot: Probot;
} => {
  const probot = createProbot(options);

  // Log all unhandled rejections
  process.on("unhandledRejection", probot.errorHandler);

  const application = probot.load(applicationFn);
  probot.load(sentryApp);

  probot.server.use(logRequestErrors);

  application
    .route("/")
    .get("/", async (request: IncomingMessage, response: ServerResponse) => {
      const name = await fetchAppName(application);
      response.statusCode = 200;
      response.end(getLandingPage(name));
    });

  return { application, probot };
};

/**
 * Starts the given application function.
 * To be called in a file to be built by @now/node-server.
 *
 * @param applicationFn - The function corresponding to this GitHub App.
 */
const start = (
  applicationFn: ApplicationFunction,
): Promise<{ port: number; stop: () => void }> => {
  const { probot } = _createProbotAndLoadApplication(applicationFn);

  return new Promise(resolve => {
    const server = probot.server.listen(options.port, () => {
      const { port } = server.address();
      probot.logger.info(`Listening on http://localhost:${port}`);
      resolve({ port, stop: server.close.bind(server) });
    });
  });
};

export { _createProbotAndLoadApplication, start };
