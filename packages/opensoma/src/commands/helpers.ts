import { CredentialManager } from "../credential-manager";
import { SomaHttp } from "../http";

export async function getHttpOrExit(): Promise<SomaHttp> {
  const manager = new CredentialManager();
  const creds = await manager.getCredentials();
  if (!creds) {
    console.error(
      JSON.stringify({
        error: "Not logged in. Run: opensoma auth login or opensoma auth extract",
      }),
    );
    process.exit(1);
  }

  const http = new SomaHttp({ sessionCookie: creds.sessionCookie, csrfToken: creds.csrfToken });

  const identity = await http.checkLogin();
  if (!identity) {
    console.error(
      JSON.stringify({
        error: "Session expired. Run: opensoma auth login or opensoma auth extract",
      }),
    );
    process.exit(1);
  }

  return http;
}
