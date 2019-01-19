import { IncomingMessage, ServerResponse } from "http";

import axios from "axios";
import * as getPort from "get-port";
import { ApplicationFunction } from "probot";
import * as sentryApp from "probot/lib/apps/sentry";
import * as logRequestErrors from "probot/lib/middleware/log-request-errors";

import { getLandingPage } from "./landing-page";
import { createProbot, fetchAppName } from "./utils";

type RequestHandler = (
  request: IncomingMessage,
  response: ServerResponse,
) => void;

const getBody = (request: IncomingMessage) =>
  new Promise((resolve, reject) => {
    const chunks: any = [];

    request.on("data", chunk => {
      chunks.push(chunk);
    });

    request.on("end", () => {
      const body = Buffer.concat(chunks).toString();
      resolve(body);
    });

    request.on("error", reject);
  });

const initializeProbot = (applicationFn: ApplicationFunction) => {
  const probot = createProbot();

  // Log all unhandled rejections
  process.on("unhandledRejection", probot.errorHandler);

  const application = probot.load(applicationFn);
  probot.load(sentryApp);

  probot.server.use(logRequestErrors);

  application
    .route("/")
    .get(
      "/",
      async (
        internalRequest: IncomingMessage,
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
const toLambda = (applicationFn: ApplicationFunction): RequestHandler => async (
  request,
  response,
) => {
  const [body, port, probot] = await Promise.all([
    getBody(request),
    getPort(),
    initializeProbot(applicationFn),
  ]);

  const server = probot.server.listen(port, async () => {
    try {
      const responseFromServer = await axios({
        data: body,
        headers: request.headers,
        method: request.method,
        url: `http://localhost:${server.address().port}`,
        validateStatus: () => true,
      });

      response.statusCode = responseFromServer.status;
      Object.keys(responseFromServer.headers).forEach(headerName => {
        response.setHeader(headerName, responseFromServer.headers[headerName]);
      });
      response.end(responseFromServer.data);
    } catch (error) {
      response.statusCode = 500;
      response.end(error.message);
    } finally {
      server.close();
    }
  });
};

export = toLambda;
