import request from "supertest";
import generateUuid from "uuid/v4";

import { toLambda } from ".";
import { createProbot, fetchAppName } from "./utils";

test("landing page contains the app name", async () => {
  const unusedAppFn = () => {
    // nop
  };
  const handler = toLambda(unusedAppFn);
  const probot = createProbot();
  const application = probot.load(unusedAppFn);
  const name = await fetchAppName(application);
  const response = await request(handler).get("/");

  expect(response.text).toMatch(name);
  expect(response.status).toBe(200);
});

describe("webhook", () => {
  const receive = async ({
    payload = {},
    signature = createProbot().webhook.sign(payload),
  }: {
    payload: object;
    signature?: string;
  }) => {
    let receivedPayload: any;

    const event = "issues";
    const appFn = (application: any) => {
      application.on(event, async (context: any) => {
        receivedPayload = context.payload;
      });
    };
    const handler = toLambda(appFn);
    const response = await request(handler)
      .post("/")
      .set("x-github-delivery", generateUuid())
      .set("x-github-event", event)
      .set("x-hub-signature", signature)
      .send(payload);

    return { receivedPayload, response };
  };

  test("subscription", async () => {
    const payload = { test: true };
    const { receivedPayload, response } = await receive({ payload });

    expect(response.text).toMatch("ok");
    expect(response.status).toBe(200);
    expect(receivedPayload).toEqual(payload);
  });

  test("signature verification", async () => {
    const { receivedPayload, response } = await receive({
      payload: {},
      signature: "wrong signature",
    });

    expect(response.text).toMatch(
      "signature does not match event payload and secret",
    );
    expect(response.status).toBe(400);
    expect(receivedPayload).toBeUndefined();
  });
});
