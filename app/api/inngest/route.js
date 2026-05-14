import { serve } from "inngest/next";
import { inngest } from "@/lib/inngest/client";
import { paymentReminders } from "@/lib/inngest/payment-reminders"; // ✅ ADD THIS
//import { spendingInsights } from "@/lib/inngest/spending-insights";

export const { GET, POST, PUT } = serve({
  client: inngest,
  functions: [
    paymentReminders, // ✅ NOW IT EXISTS
   //spendingInsights,
  ],
});
