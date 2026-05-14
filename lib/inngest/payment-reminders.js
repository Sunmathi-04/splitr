import { ConvexHttpClient } from "convex/browser";
import { api } from "@/convex/_generated/api";
import { inngest } from "./client";
import { Resend } from "resend";

// Initialize Convex client
const convex = new ConvexHttpClient(process.env.NEXT_PUBLIC_CONVEX_URL);

// Initialize Resend
const resend = new Resend(process.env.RESEND_API_KEY);

export const paymentReminders = inngest.createFunction(
  {
    id: "send-payment-reminders",
    triggers: [
      {
        cron: "0 10 * * *", // Daily at 10 AM UTC
      },
    ],
  },

  async ({ step }) => {
    console.log("PAYMENT REMINDER FUNCTION STARTED");

    /* Fetch users with outstanding debts */
    const users = await step.run("fetch-debts", () =>
      convex.query(api.inngest.getUsersWithOutstandingDebts)
    );

    console.log("USERS:", users);

    /* Send emails */
    const results = await step.run("send-emails", async () => {
      return Promise.all(
        users.map(async (u) => {
          const rows = u.debts
            .map(
              (d) => `
                <tr>
                  <td style="padding:4px 8px;">${d.name}</td>
                  <td style="padding:4px 8px;">₹${d.amount.toFixed(2)}</td>
                </tr>
              `
            )
            .join("");

          // Skip if no debts
          if (!rows) {
            return {
              userId: u._id,
              skipped: true,
            };
          }

          const html = `
            <h2>Splitr – Payment Reminder</h2>

            <p>
              Hi ${u.name}, you have the following outstanding balances:
            </p>

            <table
              cellspacing="0"
              cellpadding="0"
              border="1"
              style="border-collapse:collapse;"
            >
              <thead>
                <tr>
                  <th style="padding:6px 10px;">To</th>
                  <th style="padding:6px 10px;">Amount</th>
                </tr>
              </thead>

              <tbody>
                ${rows}
              </tbody>
            </table>

            <p>Please settle up soon. Thanks!</p>
          `;

          try {
            const result = await resend.emails.send({
              from: "Splitr <onboarding@resend.dev>",
              to: u.email,
              subject: "You have pending payments on Splitr",
              html,
            });

            console.log("EMAIL RESULT:", result);

            return {
              userId: u._id,
              success: true,
            };
          } catch (err) {
            console.error("EMAIL ERROR:", err);

            return {
              userId: u._id,
              success: false,
              error: err.message,
            };
          }
        })
      );
    });

    return {
      processed: results.length,
      successes: results.filter((r) => r.success).length,
      failures: results.filter((r) => r.success === false).length,
    };
  }
);