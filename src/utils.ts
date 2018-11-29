import { Application, createProbot as _createProbot } from "probot";
import { findPrivateKey } from "probot/lib/private-key";

const createProbot = () => {
  const options = {
    cert: String(findPrivateKey()),
    id: Number(process.env.APP_ID),
    secret: process.env.WEBHOOK_SECRET,
  };
  return _createProbot(options);
};

const fetchAppName = async (application: Application): Promise<string> => {
  const octokit = await application.auth();
  const {
    data: { name },
  } = await (octokit as any).apps.getAuthenticated();
  return name;
};

export { createProbot, fetchAppName };
