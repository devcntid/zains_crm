import { orgFaviconResponse } from "@/lib/org/favicon-response";

export const dynamic = "force-dynamic";
export const contentType = "image/png";
export const size = { width: 32, height: 32 };

export default async function Icon() {
  return orgFaviconResponse();
}
