// Scheduled: refreshes dashboard data at 6 AM, 12 PM, 6 PM and 12 AM Central.
// The schedule lists both UTC hours each target can fall on (daylight saving), and the run only proceeds on a target Central hour.
import { refresh, TZ } from "../lib/refresh.mjs";

export default async (req, context) => {
  const hour = Number(new Intl.DateTimeFormat("en-US", { timeZone: TZ, hour: "numeric", hourCycle: "h23" }).format(new Date()));
  if (![0, 6, 12, 18].includes(hour)) return;
  await refresh(context, { salesDays: 2 });
};

export const config = { schedule: "2 0,5,6,11,12,17,18,23 * * *" };
