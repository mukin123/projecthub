// ============================================
// FILE: Migrate_To_Firestore.gs
// One-time migration of Emails sheet → Firestore mail_register
// ============================================

/**
 * Run this ONCE to migrate existing emails from Google Sheet
 * to the Firestore mail_register collection.
 *
 * HOW TO RUN:
 *   Apps Script Editor → select "migrateEmailsToFirestore" → Run
 */
function migrateEmailsToFirestore() {
  const ss       = SpreadsheetApp.getActiveSpreadsheet();

  // ── Adjust this to match your actual sheet tab name ──
  const sheet    = ss.getSheetByName('Emails') || ss.getSheetByName('Mail Register');

  if (!sheet) {
    Logger.log('ERROR: Could not find Emails or Mail Register sheet tab.');
    return;
  }

  const rows    = sheet.getDataRange().getValues();
  const headers = rows[0].map(h => String(h).trim().toLowerCase().replace(/\s+/g, '_'));
  const data    = rows.slice(1);

  Logger.log(`Found ${data.length} rows to migrate.`);

  let success = 0;
  let errors  = 0;

  data.forEach((row, idx) => {
    try {
      // Map row values to header keys
      const raw = {};
      headers.forEach((h, i) => { raw[h] = row[i] !== undefined ? row[i] : ''; });

      // Build the standardised record
      // Adjust the field mappings below to match your actual column names
      const record = {
        mail_id:      'MAIL_' + String(idx + 1).padStart(5, '0'),
        project:      raw.project      || raw.project_name || '',
        phase:        raw.phase        || '',
        category:     raw.category     || '',
        date:         raw.date         ? String(raw.date) : '',
        sender:       raw.sender       || raw.from        || '',
        recipient:    raw.recipient    || raw.to           || '',
        cc:           raw.cc           || '',
        subject:      raw.subject      || raw.mail_subject || '',
        summary:      raw.summary      || raw.mail_summary || '',
        action_items: raw.action_items || '',
        status:       raw.status       || 'done',
        gmail_link:   raw.gmail_link   || raw.mail        || raw.link || ''
      };

      // Skip completely empty rows
      if (!record.project && !record.sender && !record.summary) return;

      addMailRecord(record);
      success++;

      // Log progress every 50 records
      if (success % 50 === 0) Logger.log(`Migrated ${success} records...`);

      // Small delay to avoid hitting Firestore rate limits
      if (idx % 20 === 0) Utilities.sleep(200);

    } catch (e) {
      errors++;
      Logger.log(`ERROR on row ${idx + 2}: ${e.message}`);
    }
  });

  Logger.log(`Migration complete. Success: ${success}, Errors: ${errors}`);
}

/**
 * Test connection — adds one sample record to Firestore
 * Run this first to verify the connection works
 */
function testFirestoreConnection() {
  try {
    const testRecord = {
      mail_id:      'TEST_00001',
      project:      'Test Project',
      phase:        'Development',
      category:     'Permitting',
      date:         '2026-02-24',
      sender:       'test@example.com',
      recipient:    'veselin@renalfa.com',
      cc:           '',
      subject:      'Test email',
      summary:      'This is a test record to verify Firestore connection.',
      action_items: 'Verify connection works',
      status:       'done',
      gmail_link:   ''
    };

    addMailRecord(testRecord);
    Logger.log('SUCCESS — test record written to Firestore mail_register collection.');
    Logger.log('Go to Firebase Console → Firestore → mail_register to see it.');
  } catch (e) {
    Logger.log('FAILED — ' + e.message);
  }
}

/**
 * Clean up — deletes the test record after verifying connection
 */
function deleteTestRecord() {
  firestoreDelete('mail_register', 'TEST_00001');
  Logger.log('Test record deleted.');
}
