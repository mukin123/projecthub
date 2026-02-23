function generateAISummary(project, phase, category, emails, config) {
  const emailTexts = emails.map((email, idx) => {
    return `Email ${idx + 1}:
Date: ${email.date}
From: ${email.sender}
Summary: ${email.summary}
---`;
  }).join('\n');
  
  const prompt = `You are analyzing email communications for project management.

PROJECT: ${project}
PHASE: ${phase}              // ← NEW: Added phase context
CATEGORY: ${category}
NUMBER OF EMAILS: ${emails.length}

EMAIL SUMMARIES:
${emailTexts}

Please analyze these emails and provide:

1. EXECUTIVE SUMMARY (2-3 sentences): High-level overview
2. KEY POINTS (bullet list): Main topics and decisions (max 5 points)
3. ACTION ITEMS (bullet list): Tasks marked TODO or pending (with owner if mentioned)
4. COMPLETED ITEMS (bullet list): Tasks marked DONE or completed
5. RISK AREAS (bullet list): Concerns, blockers, or issues identified
6. NEXT STEPS (bullet list): Recommended immediate actions
7. CONSTRUCTION KPIS (Numbers 0-100 ONLY): If this is a Construction phase email, estimate the completion percentage for these milestones. If a specific % is mentioned, use it. If marked 'done', use 100. If not mentioned or not started, use 0.

Format your response as JSON:
{
  "executive": "...",
  "keyPoints": "• Point 1\\n• Point 2\\n...",
  "actionItems": "• Task 1 (Owner: X)\\n• Task 2\\n...",
  "completedItems": "• Item 1\\n• Item 2\\n...",
  "risks": "• Risk 1\\n• Risk 2\\n...",
  "nextSteps": "• Step 1\\n• Step 2\\n...",
  "civil_works_pct": 0,
  "pv_ramming_pct": 0,
  "pv_mounting_pct": 0,
  "bess_pct": 0,
  "electrical_pct": 0,
  "commissioning_pct": 0
}

Keep each bullet point concise. If a section has no items, use "None identified".`;

  try {
    const response = callOpenRouterAPI(prompt, config);
    return response;
  } catch (error) {
    Logger.log(`API Error: ${error}`);
    throw error;
  }
}

function callOpenRouterAPI(prompt, config) {
  const url = 'https://openrouter.ai/api/v1/chat/completions';
  
  const payload = {
    model: config.default_model,
    messages: [{ role: 'user', content: prompt }]
  };
  
  const options = {
    method: 'post',
    headers: {
      'Authorization': 'Bearer ' + config.openrouter_api_key,
      'Content-Type': 'application/json'
    },
    payload: JSON.stringify(payload),
    muteHttpExceptions: true
  };
  
  const response = UrlFetchApp.fetch(url, options);
  const responseCode = response.getResponseCode();
  const responseText = response.getContentText();
  
  if (responseCode !== 200) {
    throw new Error(`API Error ${responseCode}: ${responseText}`);
  }
  
  const result = JSON.parse(responseText);
  const content = result.choices[0].message.content;
  const tokensUsed = result.usage ? (result.usage.prompt_tokens + result.usage.completion_tokens) : 0;
  
  const jsonMatch = content.match(/\{[\s\S]*\}/);
  if (jsonMatch) {
    const summaryData = JSON.parse(jsonMatch[0]);
    summaryData.tokensUsed = tokensUsed;
    return summaryData;
  } else {
    throw new Error('Could not parse JSON from API');
  }
}
