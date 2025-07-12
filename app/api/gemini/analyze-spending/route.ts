import { NextRequest, NextResponse } from 'next/server'

export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  try {
    const { expenses } = await request.json()

    if (!expenses || !Array.isArray(expenses)) {
      return NextResponse.json(
        { error: 'Invalid expenses data provided' },
        { status: 400 }
      )
    }

    // Use the Gemini API key from the environment variable
    const apiKey = process.env.GEMINI_API_KEY

    if (!apiKey || apiKey === 'YOUR_GEMINI_API_KEY_HERE') {
      // Return fallback analysis if no API key
      const totalAmount = expenses.reduce((sum, exp) => sum + exp.amount, 0)
      const categories = Array.from(new Set(expenses.map(exp => exp.category)))
      const topCategory = expenses.reduce((acc, exp) => {
        acc[exp.category] = (acc[exp.category] || 0) + exp.amount
        return acc
      }, {} as Record<string, number>)
      
      const topSpendingCategory = Object.entries(topCategory)
        .sort(([,a], [,b]) => (Number(b) - Number(a)))[0] || ['N/A', 0];
      const [topCategoryName, topCategoryAmount] = topSpendingCategory;

      const fallbackAnalysis = `
📊 SPENDING ANALYSIS REPORT

💰 Total Analyzed: $${totalAmount.toFixed(2)}
📈 Categories Found: ${categories.length}
🏆 Top Spending Category: ${topCategoryName} ($${Number(topCategoryAmount).toFixed(2)})

🔍 KEY INSIGHTS:
• Your highest spending is in ${topCategoryName}, accounting for ${totalAmount > 0 ? ((Number(topCategoryAmount) / totalAmount) * 100).toFixed(1) : '0'}% of total expenses
• You have expenses across ${categories.length} different categories, showing good spending diversity
• Average expense amount: $${(totalAmount / expenses.length).toFixed(2)}

💡 MONEY-SAVING RECOMMENDATIONS:
1. Consider setting a weekly budget for ${topCategoryName} to control your highest spending category
2. Track smaller expenses - they can add up quickly over time
3. Review recurring expenses in categories like Bills & Utilities for potential savings

⚡ QUICK TIPS:
• Use the budget feature to set limits for your top spending categories
• Consider the 50/30/20 rule: 50% needs, 30% wants, 20% savings
• Review your expenses weekly to stay on track`

      return NextResponse.json({ analysis: fallbackAnalysis })
    }

    // Prepare the prompt for Gemini
    const prompt = `
You are a financial advisor AI. Analyze the following expense data and provide insights:

Expense Data:
${expenses.map(exp => `- $${exp.amount} on ${exp.category} (${exp.date}): ${exp.description || 'No description'}`).join('\n')}

Please provide:
1. Top 3-5 spending categories with amounts
2. Spending patterns and trends you notice
3. 2-3 specific, actionable money-saving recommendations
4. Any concerning spending habits

Keep the response concise but insightful, formatted nicely with emojis and clear sections.
`

    // Make the API call to Gemini
    const response = await fetch('https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-goog-api-key': apiKey,
      },
      body: JSON.stringify({
        contents: [{
          parts: [{
            text: prompt
          }]
        }],
        generationConfig: {
          temperature: 0.7,
          topP: 0.8,
          topK: 40,
          maxOutputTokens: 1000,
        }
      }),
    })

    if (!response.ok) {
      return NextResponse.json(
        { error: 'Gemini API error', details: await response.json() },
        { status: 500 }
      );
    }

    const data = await response.json();
    const analysis = data.candidates?.[0]?.content?.parts?.[0]?.text || 'Unable to generate analysis'

    return NextResponse.json({ analysis })
  } catch (error) {
    // Removed console.error for production
    let details = '';
    const err = error as unknown;
    if (typeof err === 'object' && err) {
      const errObj = err as Record<string, unknown>;
      if ('message' in errObj && typeof errObj.message === 'string') {
        details = errObj.message;
      } else {
        details = String(errObj);
      }
    } else {
      details = String(err);
    }
    return NextResponse.json(
      { error: 'Failed to analyze spending data', details },
      { status: 500 }
    );
  }
}