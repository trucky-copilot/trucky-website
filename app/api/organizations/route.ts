import { NextRequest, NextResponse } from "next/server";
import { base44Call, googleIdentity, sameOrigin } from "@/lib/server/base44";
export const dynamic = "force-dynamic";
function failure(error: unknown) {
  const code = error instanceof Error ? error.message : "BASE44_UNAVAILABLE";
  const known = ["SIGN_IN_REQUIRED", "INTEGRATION_PENDING", "BASE44_UNAVAILABLE"].includes(code) ? code : "BASE44_UNAVAILABLE";
  return NextResponse.json({ error: known }, { status: known === "SIGN_IN_REQUIRED" ? 401 : 503, headers: { "Cache-Control": "no-store" } });
}
export async function GET(req: NextRequest) {
  try {
    const identity = await googleIdentity(req);
    const result = await base44Call("resolveUserOrganizations", { google_id_token: identity.idToken });
    if (result.user?.google_sub !== identity.sub || !Array.isArray(result.organizations)) throw Error("BASE44_UNAVAILABLE");
    const organizations = result.organizations.map((org: any) => {
      if (typeof org.id !== "string" || typeof org.name !== "string" || !["owner", "admin"].includes(org.role)) throw Error("BASE44_UNAVAILABLE");
      return { id: org.id, name: org.name, subscription_status: org.subscription_status };
    });
    return NextResponse.json({ organizations }, { headers: { "Cache-Control": "no-store" } });
  } catch (error) { return failure(error); }
}
export async function POST(req: NextRequest) {
  if (!sameOrigin(req)) return NextResponse.json({ error: "FORBIDDEN" }, { status: 403 });
  try {
    const identity = await googleIdentity(req);
    const body = await req.json();
    if (typeof body.company_name !== "string" || !body.company_name.trim() || body.company_name.length > 120) return NextResponse.json({ error: "INVALID_COMPANY_NAME" }, { status: 400 });
    const result = await base44Call("createOrganizationForUser", { google_id_token: identity.idToken, company_name: body.company_name.trim() });
    if (typeof result.org_id !== "string" || result.role !== "owner") throw Error("BASE44_UNAVAILABLE");
    return NextResponse.json({ organization: { id: result.org_id, name: result.name } }, { headers: { "Cache-Control": "no-store" } });
  } catch (error) { return failure(error); }
}
