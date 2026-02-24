// ============================================
// FILE: Gmail_Firestore_Sync.gs
// Parallel email → Firestore sync
// Runs independently — does NOT touch existing Mail_Register sheet
// or processSentEmailsAI() in any way
// ============================================

const FIRESTORE_LABEL = 'Firestore_Synced'; // Gmail label to mark processed emails

// ── Main entry point (called by time trigger) ──────────────────────────────

function syncEmailsToFirestore() {
  try {
    let label = GmailApp.getUserLabelByName(FIRESTORE_LABEL);
    if (!label) label = GmailApp.createLabel(FIRESTORE_LABEL);

    let saved = 0, skipped = 0, errors = 0;

    // Process incoming (inbox) and outgoing (sent) separately
    saved += _syncThreads('in:inbox newer_than:2h -label:' + FIRESTORE_LABEL, label, 'incoming');
    saved += _syncThreads('in:sent newer_than:2h -label:' + FIRESTORE_LABEL, label, 'outgoing');

    Logger.log(`Firestore sync complete — saved: ${saved}, skipped: ${skipped}, errors: ${errors}`);
  } catch (e) {
    Logger.log('syncEmailsToFirestore ERROR: ' + e.message);
  }
}

function _syncThreads(query, label, direction) {
  const config   = getConfig();
  const threads  = GmailApp.search(query);
  let saved = 0;

  threads.forEach(thread => {
    const messages = thread.getMessages();

    messages.forEach(msg => {
      try {
        // Skip if already synced (check by message ID in Firestore)
        const msgId = msg.getId();

        // Build record
        const record = {
          mail_id:      'GMAIL_' + msgId,
          project:      '',               // filled by AI below
          phase:        '',
          category:     '',
          date:         msg.getDate().toISOString(),
          sender:       msg.getFrom(),
          recipient:    msg.getTo(),
          cc:           msg.getCc() || '',
          subject:      msg.getSubject(),
          summary:      '',
          action_items: '',
          status:       'pending',
          gmail_link:   'https://mail.google.com/mail/u/0/#all/' + msgId,
          direction:    direction
        };

        // Use AI to classify + extract
        const classified = _classifyEmailWithAI(msg, config);
        if (classified) {
          record.project      = classified.project      || '';
          record.phase        = classified.phase        || '';
          record.category     = classified.category     || '';
          record.summary      = classified.summary      || '';
          record.action_items = classified.action_items || '';
          record.status       = 'done';
        }

        // Write to Firestore (uses mail_id as document ID — prevents duplicates)
        addMailRecord(record);

        // Label email as synced
        thread.addLabel(label);
        saved++;

        Utilities.sleep(500); // avoid rate limits

      } catch (e) {
        Logger.log(`Error on message ${msg.getId()}: ${e.message}`);
      }
    });
  });

  return saved;
}

// ── AI classification of a single email ────────────────────────────────────

function _classifyEmailWithAI(msg, config) {
  try {
    const ss        = SpreadsheetApp.getActiveSpreadsheet();
    const catSheet  = ss.getSheetByName('Category_Reference');
    let validCategories = '';
    if (catSheet) {
      const catData = catSheet.getRange(2, 1, catSheet.getLastRow() - 1, 2).getValues();
      validCategories = catData.map(r => `${r[0]} → ${r[1]}`).join('\n');
    }

    // Get valid projects
    let validProjects = '';
    try {
      const extSs    = SpreadsheetApp.openByUrl('https://docs.google.com/spreadsheets/d/1bv8MnkuTbru2mTPVq7U5WKyUUURWK6KWXYKYmi4dfWA/edit');
      const extSheet = extSs.getSheetByName('Projects');
      if (extSheet) {
        validProjects = extSheet.getRange(2, 1, extSheet.getLastRow() - 1, 1)
          .getValues().map(r => r[0]).filter(Boolean).join(', ');
      }
    } catch (e) { /* ignore */ }

    const body = msg.getPlainBody().substring(0, 2000);

    const prompt = `Analyse this email and return JSON only. No explanation.

Email:
From: ${msg.getFrom()}
To: ${msg.getTo()}
Subject: ${msg.getSubject()}
Body: ${body}

Valid Projects: [${validProjects}]
Valid Phases & Categories:
${validCategories}

Return EXACTLY this JSON (no markdown, no extra text):
{
  "project": "match from valid projects list or empty string",
  "phase": "match from valid phases or empty string",
  "category": "match from valid categories or empty string",
  "summary": "2-3 sentence management summary of the email",
  "action_items": "bullet list of action items, or empty string if none"
}`;

    const response = callOpenRouterAPI(prompt, config);

    // callOpenRouterAPI returns parsed object already
    if (response && typeof response === 'object') return response;

    // Fallback: try to parse if returned as string
    const text = typeof response === 'string' ? response : JSON.stringify(response);
    const match = text.match(/\{[\s\S]*\}/);
    return match ? JSON.parse(match[0]) : null;

  } catch (e) {
    Logger.log('AI classification error: ' + e.message);
    return null;
  }
}

// ── Trigger setup ───────────────────────────────────────────────────────────

/**
 * Run this ONCE to set up the hourly trigger.
 * Apps Script → select setupFirestoreSyncTrigger → Run
 */
function setupFirestoreSyncTrigger() {
  // Remove any existing trigger for this function first
  ScriptApp.getProjectTriggers().forEach(t => {
    if (t.getHandlerFunction() === 'syncEmailsToFirestore') {
      ScriptApp.deleteTrigger(t);
    }
  });

  // Create new hourly trigger
  ScriptApp.newTrigger('syncEmailsToFirestore')
    .timeBased()
    .everyHours(1)
    .create();

  Logger.log('Hourly trigger set up for syncEmailsToFirestore.');
}

/**
 * Remove the trigger (if you want to pause the sync)
 */
function removeFirestoreSyncTrigger() {
  ScriptApp.getProjectTriggers().forEach(t => {
    if (t.getHandlerFunction() === 'syncEmailsToFirestore') {
      ScriptApp.deleteTrigger(t);
      Logger.log('Trigger removed.');
    }
  });
}

/**
 * Test — run manually to process the last 2 hours right now
 */
function testFirestoreSync() {
  syncEmailsToFirestore();
  Logger.log('Test sync complete. Check Firestore mail_register collection.');
}
