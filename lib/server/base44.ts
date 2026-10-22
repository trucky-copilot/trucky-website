import { getToken } from "next-auth/jwt";
import type { NextRequest } from "next/server";

export async function googleIdentity(req: NextRequest) {
  const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET });
  if (!token?.sub || typeof token.googleIdToken !== "string" || typeof token.googleTokenExpires !== "number" || token.googleTokenExpires <= Date.now() / 1000 + 30) {
    throw new Error("SIGN_IN_REQUIRED");
  }
  return { sub: token.sub, idToken: token.googleIdToken };
}
export function sameOrigin(req: NextRequest) {
  const configured = process.env.NEXTAUTH_URL;
  return !!configured && req.headers.get("origin") === new URL(configured).origin;
}
export async function base44Call(name: "resolveUserOrganizations" | "createOrganizationForUser", data: Record<string, unknown>) {
  // Disabled until the backend identity PR is deployed and tested.
  if (process.env.BASE44_ORGANIZATIONS_ENABLED !== "true") throw new Error("INTEGRATION_PENDING");
  const secret = process.env.TRUCKY_SERVER_SECRET;
  if (!secret) throw new Error("INTEGRATION_PENDING");
  const response = await fetch(`https://trucky-17a283d5.base44.app/api/functions/${name}`, {
    method: "POST", redirect: "error", cache: "no-store", signal: AbortSignal.timeout(15000),
    headers: { Authorization: `Bearer ${secret}`, "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  if (!response.ok) {
    console.error("base44_request_failed", { operation: name, status: response.status });
    throw new Error(response.status === 401 ? "SIGN_IN_REQUIRED" : "BASE44_UNAVAILABLE");
  }
  return response.json();
}
