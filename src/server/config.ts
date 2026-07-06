export class AppConfigError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "AppConfigError";
  }
}

export function getRequiredEnv(name: string) {
  const value = process.env[name];

  if (!value) {
    throw new AppConfigError(`Missing required environment variable: ${name}`);
  }

  return value;
}

export function getAppUrl() {
  return process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";
}
