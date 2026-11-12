// Scheduled nightly backup: refreshes dashboard data at about 2 AM Central, catching up on any days missed.
// The schedule lists both UTC hours 2 AM can fall on (daylight saving); the run only proceeds at 2 AM Central.
// Opening the dashboard also refreshes it when the data is more than 10 minutes old.
import { refresh, TZ } from "../lib/refresh.mjs";

export default async (req, context) => {
  const hour = Number(new Intl.DateTimeFormat("en-US", { timeZone: TZ, hour: "numeric", hourCycle: "h23" }).format(new Date()));
  if (hour !== 2) return;
  await refresh(context, { catchUp: true });
};

export const config = { schedule: "17 7,8 * * *" };
