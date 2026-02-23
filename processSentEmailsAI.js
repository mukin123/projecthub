// ============================================
// OUTGOING EMAIL SWEEPER & AI CATEGORIZATION (v2.2)
// Includes Strict Table Formatting Rules
// ============================================

function processSentEmailsAI() {
  const config = getConfig();
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const mailSheet = ss.getSheetByName('Mail_Register');
  const catSheet = ss.getSheetByName('Category_Reference');

  // 1. Fetch valid Phases and Categories
  let validCategories = "Unknown";
  if (catSheet) {
    const catData = catSheet.getRange(2, 1, catSheet.getLastRow() - 1, 2).getValues();
    validCategories = catData.map(row => `${row[0]} -> ${row[1]}`).join('\n');
  }

  // 2. Fetch valid Projects from external sheet ("Projects" tab, Column A)
  const projectSheetUrl = 'https://docs.google.com/spreadsheets/d/1bv8MnkuTbru2mTPVq7U5WKyUUURWK6KWXYKYmi4dfWA/edit?gid=0#gid=0';
  let validProjects = "Unknown";
  try {
    const extSs = SpreadsheetApp.openByUrl(projectSheetUrl);
    // Explicitly target the "Projects" tab as seen in the screenshot
    const extSheet = extSs.getSheetByName('Projects');
    if (extSheet) {
      // Get Column 1 (A), starting from Row 2 to skip the header
      const projectData = extSheet.getRange(2, 1, extSheet.getLastRow() - 1, 1).getValues();
      // Filter out any blank cells and join them into a clean comma-separated list
      validProjects = projectData.map(row => String(row[0]).trim()).filter(p => p !== "").join(', ');
    } else {
      Logger.log("⚠️ Could not find a tab named 'Projects'.");
    }
  } catch (error) {
    Logger.log("⚠️ Could not load external project list. Did you authorize the script? Error: " + error);
  }

  // 3. Search for sent emails in the last 2 hours
  const labelName = "AI_Logged";
  let label = GmailApp.getUserLabelByName(labelName);
  if (!label) { label = GmailApp.createLabel(labelName); }

  const threads = GmailApp.search('in:sent newer_than:2h -label:' + labelName);

  if (threads.length === 0) {
    Logger.log("No new sent emails to process.");
    return;
  }

  threads.forEach(thread => {
    const messages = thread.getMessages();
    const sentMsg = messages[messages.length - 1];

    if (sentMsg.getFrom().includes(Session.getActiveUser().getEmail())) {
      const subject = sentMsg.getSubject();
      const body = sentMsg.getPlainBody();
      const date = sentMsg.getDate();
      const to = sentMsg.getTo();

      Logger.log(`Processing sent email: ${subject}`);

      // 4. The highly-structured prompt (Strictly enforcing the table)
      const prompt = `Convert this email into a PROJECT LOG.

      Goal: Capture only management-level items, not small steps.

      Include ONLY:
      - completed deliverables
      - key findings or decisions
      - major responsibilities or next actions

      Exclude: analysis steps, discussions, internal checks, minor tasks, historical references, anything older than the current event.

      Merge related items into one line. Be concise and aggregate similar actions. Max 6–8 rows total.

      STRICT TABLE FORMATTING RULES:
      1. Output EXACTLY this markdown table header and separator (do NOT use colons like :---):
      | Project | Category | Status (DONE/NEXT) | Summary (max 10 words) | Owner | Due |
      |---|---|---|---|---|---|
      2. Column 1 (Project): You MUST determine the main Project Name and repeat it identically on EVERY SINGLE ROW. Do not write task names or sub-areas in this column.
      3. Column 6 (Due): All dates MUST be strictly formatted as YYYY-MM-DD (e.g., 2026-02-09). If no date is mentioned, use "N/A".

      EMAIL CONTENT:
      To: ${to}
      Subject: ${subject}
      Body: ${body.substring(0, 3000)}

      VALID REFERENCE LISTS:
      Projects: [ ${validProjects} ]
      Phases & Categories:
      ${validCategories}

      INSTRUCTIONS FOR JSON OUTPUT:
      1. "project": Find the project name matching one of the list above based on the email content. The name returned always starts with a capital letter, followed by lowercase letters and must match exactly to the list given.
      2. "phase": Must perfectly match a Phase from the list.
      3. "category": Must perfectly match a Category from the list.
      4. "summary_table": Provide the output table exactly in this markdown format (use \\n for new lines) with NO conversational text before or after.

      Format your response EXACTLY as valid JSON:
      {
        "project": "Exact Project Name",
        "phase": "Exact Phase",
        "category": "Exact Category",
        "summary_table": "| Project | Category | Status (DONE/NEXT) | Summary (max 10 words) | Owner | Due |\\n|---|---|---|---|---|---|\\n|..."
      }`;

      try {
        const aiResponse = callOpenRouterAPI(prompt, config);

        // 5. Create the Google Doc
        const doc = DocumentApp.create(`Sent Mail: ${subject}`);
        doc.getBody().setText(`Date: ${date}\nTo: ${to}\nSubject: ${subject}\n\n${body}`);
        const docUrl = doc.getUrl();

        // 6. Append to Mail_Register
        mailSheet.appendRow([
          aiResponse.project || "Unknown Project",
          aiResponse.phase || "Unknown Phase",
          aiResponse.category || "Unknown Category",
          date,
          Session.getActiveUser().getEmail(),
          docUrl,
          aiResponse.summary_table || "No summary generated."
        ]);

        thread.addLabel(label);
        Utilities.sleep(1000);

      } catch (error) {
        Logger.log(`Error processing sent email: ${error}`);
      }
    }
  });
}
