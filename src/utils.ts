import { Application } from "probot";

const defaultPort = 3000;

const fetchAppName = async (application: Application): Promise<string> => {
  const octokit = await application.auth();
  const {
    data: { name },
  } = await (octokit as any).apps.getAuthenticated();
  return name;
};

export { defaultPort, fetchAppName };
