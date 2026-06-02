import { db } from "@/lib/db";
import { settings } from "@/lib/schema";
import { eq } from "drizzle-orm";
import { SettingsClient } from "./settings-client";

export default async function SettingsPage() {
  const [cfg] = await db.select().from(settings).where(eq(settings.id, 1));
  return <SettingsClient settings={cfg ?? null} />;
}
