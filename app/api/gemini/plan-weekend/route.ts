import { NextRequest, NextResponse } from 'next/server'

export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  try {
    const { budget, location } = await request.json()

    if (!budget || typeof budget !== 'number' || budget <= 0) {
      return NextResponse.json(
        { error: 'Invalid budget amount provided' },
        { status: 400 }
      )
    }
    if (!location || typeof location !== 'string' || !location.trim()) {
      return NextResponse.json(
        { error: 'Invalid or missing location provided' },
        { status: 400 }
      )
    }

    // Use the Gemini API key from the environment variable
    const apiKey = process.env.GEMINI_API_KEY

    if (!apiKey || apiKey === 'YOUR_GEMINI_API_KEY_HERE') {
      // Return fallback weekend plan if no API key
      const fallbackPlan = `
🏖️ WEEKEND PLAN FOR ₹${budget.toLocaleString('en-IN', { maximumFractionDigits: 2 })} BUDGET

🎯 BUDGET BREAKDOWN:
• Meals: ₹${(budget * 0.4).toLocaleString('en-IN', { maximumFractionDigits: 2 })} (40%)
• Activities: ₹${(budget * 0.5).toLocaleString('en-IN', { maximumFractionDigits: 2 })} (50%)
• Miscellaneous: ₹${(budget * 0.1).toLocaleString('en-IN', { maximumFractionDigits: 2 })} (10%)

🌟 RECOMMENDED ACTIVITIES:

${budget >= 100 ? `
🍽️ SATURDAY:
• Morning: Coffee shop breakfast (₹12-15)
• Afternoon: Visit local museum or art gallery (₹15-20)
• Evening: Nice dinner at mid-range restaurant (₹35-45)

🎉 SUNDAY:
• Morning: Farmers market visit (₹10-15)
• Afternoon: Movie theater or mini golf (₹12-18)
• Evening: Cook at home with fresh ingredients (₹15-20)
` : budget >= 50 ? `
☕ SATURDAY:
• Morning: Local café breakfast (₹8-12)
• Afternoon: Free outdoor activity (hiking, park visit)
• Evening: Casual dinner out (₹20-25)

🏠 SUNDAY:
• Morning: Home breakfast
• Afternoon: Free community event or library visit
• Evening: Takeout dinner (₹15-20)
` : `
🏡 BUDGET-FRIENDLY WEEKEND:
• Morning: Home breakfast both days
• Activities: Free outdoor activities (parks, trails)
• Meals: Grocery shopping for home cooking (₹25-30)
• Entertainment: Free community events or streaming at home
`}

💡 MONEY-SAVING TIPS:
• Look for happy hour specials and lunch deals
• Check for free community events and festivals
• Consider potluck gatherings with friends
• Use apps to find discounts and coupons

🎈 BONUS IDEAS:
• Picnic in a local park (very budget-friendly!)
• Visit free museums on community days
• Attend local farmers markets for fresh, affordable food
• Explore walking trails and scenic spots in your area`

      return NextResponse.json({ plan: fallbackPlan })
    }

    // Prepare the prompt for Gemini
    const prompt = `
You are a helpful weekend activity planner. Create a detailed weekend plan for someone with a ₹${budget} budget in ${location}.

Please provide:
1. A suggested budget breakdown (meals, activities, etc.)
2. Specific activity recommendations for Saturday and Sunday in or near ${location}
3. Estimated costs for each suggestion
4. Money-saving tips
5. Alternative free or low-cost options

Consider the budget level:
- If budget is high (₹100+): Include nicer restaurants, paid activities
- If budget is medium (₹50-99): Mix of paid and free activities
- If budget is low (under ₹50): Focus on free/cheap activities

Format the response nicely with emojis and clear sections. Keep it practical and actionable.
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
          temperature: 0.8,
          topP: 0.9,
          topK: 40,
          maxOutputTokens: 1200,
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
    const plan = data.candidates?.[0]?.content?.parts?.[0]?.text || 'Unable to generate weekend plan'

    return NextResponse.json({ plan })
  } catch (error) {
    // Removed console.error for production
    let details = '';
    if (typeof error === 'object' && error && 'message' in error && typeof (error as any).message === 'string') {
      details = (error as any).message;
    } else {
      details = String(error);
    }
    return NextResponse.json(
      { error: 'Failed to generate weekend plan', details },
      { status: 500 }
    );
  }
}