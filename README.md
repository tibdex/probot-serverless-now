# Goal

`probot-serverless-now` is a wrapper around [Probot](https://github.com/probot/probot) to run your GitHub Apps as Serverless Functions with [ZEIT Now](https://zeit.co).

**Note**: This package is not maintained anymore as [GitHub Actions](https://github.com/features/actions) and [github-app-token](https://github.com/marketplace/actions/github-app-token) can, most of the time, replace Probot.

# Usage

- `app.js`

  ```javascript
  module.exports = app => {
    app.on("issues.opened", async context => {
      // A new issue was opened, what should we do with it?
      context.log(context.payload);
    });
  };
  ```

- `api/index.js`

  ```javascript
  const { toLambda } = require("probot-serverless-now");

  const applicationFunction = require("../app");

  module.exports = toLambda(applicationFunction);
  ```

- `now.json`

  ```json
  {
    "version": 2,
    "env": {
      "APP_ID": "@my-app-id",
      "PRIVATE_KEY": "@my-app-base64-encoded-private-key",
      "WEBHOOK_SECRET": "@my-app-webhook-secret"
    }
  }
  ```

## Supported Probot Features

- [x] [Logging](https://probot.github.io/docs/logging/)
- [x] [Sentry](https://probot.github.io/docs/configuration/) integration
- [x] Webhook signature verification
- [ ] Loading the private key from the filesystem.
      The `PRIVATE_KEY` environment variable should be used instead (possibly _base64_ encoded).
- [ ] Custom routing. The only routes are:
  - `GET /`: typical Probot landing page
  - `POST /`: webhook handler
- [ ] Multiple applications running under the same Probot instance.
      Instead, you should create multiple [Now Lambdas](https://zeit.co/docs/v2/deployments/concepts/lambdas/).
      Each lambda should have its own `now.json` file since they won't share the same `APP_ID`, `PRIVATE_KEY`, and `WEBHOOK_SECRET` environment variables.
      To do that, you could either use multiple repositories or a mono-repo with [Yarn workspaces](https://yarnpkg.com/lang/en/docs/workspaces/) or [Lerna](https://lerna.js.org/) for instance.
