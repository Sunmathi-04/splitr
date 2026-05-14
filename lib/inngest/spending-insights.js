import { ConvexHttpClient } from "convex/browser";
import { api } from "@/convex/_generated/api";
import { GoogleGenerativeAI } from "@google/generative-ai";
import { inngest } from "./client";

const convex = new ConvexHttpClient(process.env.NEXT_PUBLIC_CONVEX_URL);

/* ✅ CORRECT Gemini model */
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
const model = genAI.getGenerativeModel({
  model: "models/gemini-flash-latest",

});



export const spendingInsights = inngest.createFunction(
  { name: "Generate Spending Insights", id: "generate-spending-insights" },
  { cron: "0 8 1 * *" },
  async ({ step }) => {
    const users = await step.run("Fetch users", () =>
      convex.query(api.inngest.getUsersWithExpenses)
    );

    const results = [];

    for (const user of users) {
      const expenses = await step.run(`Expenses-${user._id}`, () =>
        convex.query(api.inngest.getUserMonthlyExpenses, {
          userId: user._id,
        })
      );

      if (!expenses.length) continue;

      const expenseData = JSON.stringify(expenses);

      const prompt = `
Analyze this user's monthly expenses and give helpful financial insights.
Respond in HTML.

${expenseData}
      `.trim();

      try {
        const aiResponse = await step.ai.wrap(
          "gemini",
          async (p) => model.generateContent(p),
          prompt
        );

        const html =
          aiResponse.response?.candidates?.[0]?.content?.parts?.[0]?.text ?? "";

        await step.run(`Email-${user._id}`, () =>
          convex.action(api.email.sendEmail, {
            to: user.email,
            subject: "Your Monthly Spending Insights",
            html,
          })
        );

        results.push({ userId: user._id, success: true });
      } catch (err) {
        results.push({ userId: user._id, success: false });
      }
    }

    return {
      processed: results.length,
      success: results.filter((r) => r.success).length,
      failed: results.filter((r) => !r.success).length,
    };
  }
);
