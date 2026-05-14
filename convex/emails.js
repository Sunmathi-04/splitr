import { v } from "convex/values";
import { action } from "./_generated/server";
import { Resend } from "resend";

export const sendEmail = action({
  args: {
    to: v.string(),
    subject: v.string(),
    html: v.string(),
    text: v.optional(v.string()),
  },

  handler: async (_, args) => {
    try {
      console.log("RESEND API KEY:", process.env.RESEND_API_KEY);

      const resend = new Resend(process.env.RESEND_API_KEY);

      const result = await resend.emails.send({
        from: "Splitr <onboarding@resend.dev>",
        to: "sunmathisr@gmail.com",
        subject: args.subject,
        html: args.html,
      });

      console.log("EMAIL RESULT:", result);

      return {
        success: true,
        result,
      };
    } catch (error) {
      console.error("EMAIL ERROR:", error);

      return {
        success: false,
        error: error.message,
      };
    }
  },
});