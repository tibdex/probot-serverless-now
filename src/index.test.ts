import * as dotenv from "dotenv";
import * as request from "supertest";
import * as generateUuid from "uuid/v4";

import { fetchAppName } from "./utils";

dotenv.config();
process.env.LOG_LEVEL = "fatal";

// The import needs to be delayed until the environment variables are set.
// Otherwise the options such as the log level would be ignored.
// tslint:disable-next-line:no-var-requires
const { _createProbotAndLoadApplication, start } = require(".");

test("landing page contains the app name", async () => {
  const { application, probot } = _createProbotAndLoadApplication(() => {
    // nop
  });
  const name = await fetchAppName(application);
  const response = await request(probot.server).get("/");

  expect(response.text).toMatch(name);
  expect(response.status).toBe(200);
});

describe("server", () => {
  let called: boolean;

  const event = "issues";
  const appFn = (application: any) => {
    application.on(event, async () => {
      called = true;
    });
  };

  beforeEach(() => {
    called = false;
  });

  test("subscription to events", async () => {
    const { probot } = _createProbotAndLoadApplication(appFn);
    const payload = {};
    const response = await request(probot.server)
      .post("/")
      .send(payload)
      .set("x-github-delivery", generateUuid())
      .set("x-github-event", event)
      .set("x-hub-signature", probot.webhook.sign(payload));

    expect(response.text).toMatch("ok");
    expect(response.status).toBe(200);
    expect(called).toBe(true);
  });

  test("signature is checked", async () => {
    const { port, stop } = await start((application: any) => {
      application.on(event, async () => {
        called = true;
      });
    });
    const response = await request(`http://localhost:${port}`)
      .post("/")
      .send({})
      .set("x-github-delivery", generateUuid())
      .set("x-github-event", event)
      .set("x-hub-signature", "wrong signature");
    stop();

    expect(response.text).toMatch(
      "signature does not match event payload and secret",
    );
    expect(response.status).toBe(400);
    expect(called).toBe(false);
  });
});
