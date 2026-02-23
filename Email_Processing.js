function parseEmailDate(dateStr) {
  if (!dateStr) {
    return new Date();
  }
  
  if (dateStr instanceof Date) {
    return dateStr;
  }
  
  let dateString = String(dateStr).trim();
  dateString = dateString.replace(/\s+(EET|EST|EDT|PST|PDT|CET|CEST|UTC|GMT|MSK|JST|IST)\b/gi, '');
  
  let parsedDate = new Date(dateString);
  
  if (isNaN(parsedDate.getTime())) {
    const datePart = dateString.split(' at ')[0];
    parsedDate = new Date(datePart);
  }
  
  if (isNaN(parsedDate.getTime())) {
    Logger.log(`⚠️ Could not parse date: "${dateStr}", using current date`);
    return new Date();
  }
  
  return parsedDate;
}

function getMostRecentEmailDate(emails) {
  let mostRecent = new Date(0);
  
  emails.forEach(email => {
    const emailDate = parseEmailDate(email.date);
    if (emailDate > mostRecent) {
      mostRecent = emailDate;
    }
  });
  
  return mostRecent;
}

function filterEmailsByActivePeriod(allGrouped, config) {
  const activeGrouped = {};
  const activePeriodMonths = config.active_period_months || 3;
  const cutoffDate = new Date();
  cutoffDate.setMonth(cutoffDate.getMonth() - activePeriodMonths);
  
  Object.keys(allGrouped).forEach(project => {
    Object.keys(allGrouped[project]).forEach(phase => {
      Object.keys(allGrouped[project][phase]).forEach(category => {
        const emails = allGrouped[project][phase][category];
        
        // Make sure emails is an array
        if (!Array.isArray(emails)) {
          Logger.log(`⚠️ Warning: emails for ${project}-${phase}-${category} is not an array`);
          return;
        }
        
        // Filter emails by date
        const activeEmails = emails.filter(email => {
          if (!email || !email.date) return false;
          
          const emailDate = parseEmailDate(email.date);
          return emailDate >= cutoffDate;
        });
        
        // Only include if there are active emails
        if (activeEmails.length > 0) {
          if (!activeGrouped[project]) {
            activeGrouped[project] = {};
          }
          if (!activeGrouped[project][phase]) {
            activeGrouped[project][phase] = {};
          }
          activeGrouped[project][phase][category] = activeEmails;
        }
      });
    });
  });
  
  return activeGrouped;
}

function generateEmailGroupHash(project, phase, category, emails) {
  const emailData = emails.map(e => 
    `${e.date}|${e.sender}|${e.summary.substring(0, 100)}`
  ).sort().join('||');
  
  const content = `${project}|${phase}|${category}|${emailData}`;  // ← Added phase
  return Utilities.computeDigest(Utilities.DigestAlgorithm.MD5, content)
    .map(byte => (byte & 0xFF).toString(16).padStart(2, '0'))
    .join('');
}

function isAlreadyProcessed(hash) {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const logSheet = ss.getSheetByName(PROCESSING_LOG_SHEET_NAME);
  
  if (!logSheet || logSheet.getLastRow() < 2) {
    return false;
  }
  
  const data = logSheet.getDataRange().getValues();
  return data.some((row, idx) => idx > 0 && row[0] === hash);
}

function updateProcessingLog(hash, project, category, emailDate, emailCount, model, tokens, status, error = '') {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const logSheet = ss.getSheetByName(PROCESSING_LOG_SHEET_NAME);
  
  const data = logSheet.getDataRange().getValues();
  let found = false;
  
  for (let i = 1; i < data.length; i++) {
    if (data[i][0] === hash) {
      const processCount = (data[i][7] || 0) + 1;
      logSheet.getRange(i + 1, 1, 1, 12).setValues([[
        hash, project, category, emailDate, emailCount,
        data[i][5], new Date(), processCount, status, model, tokens, error
      ]]);
      found = true;
      break;
    }
  }
  
  if (!found) {
    logSheet.appendRow([
      hash, project, category, emailDate, emailCount,
      new Date(), new Date(), 1, status, model, tokens, error
    ]);
  }
}

function getTimePeriod(date) {
  const d = parseEmailDate(date);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
}


function calculateStatus(emailDate, config) {
  const now = new Date();
  const date = parseEmailDate(emailDate);
  const monthsOld = (now - date) / (1000 * 60 * 60 * 24 * 30);
  
  if (monthsOld <= config.active_period_months) {
    return 'Active';
  } else if (monthsOld <= config.recent_period_months) {
    return 'Recent';
  } else {
    return 'Archived';
  }
}


function processEmailsSmart() {
  const config = getConfig();
  if (!config.openrouter_api_key || config.openrouter_api_key === '') {
    SpreadsheetApp.getUi().alert('⚠️ Please set your OpenRouter API key!\n\n📧 Email Processor → 🔑 Set API Key');
    return;
  }
  
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const logSheet = ss.getSheetByName(LOG_SHEET_NAME);
  if (!logSheet) throw new Error(`Sheet "${LOG_SHEET_NAME}" not found`);
  
  const summarySheet = setupSummarySheet();
  setupProcessingLogSheet();
  
  const existingSummaries = loadExistingSummaries(summarySheet);
  const data = logSheet.getDataRange().getValues();
  const headers = data[0];
  const rows = data.slice(1);
  
  const colIndices = {
    project: headers.indexOf('Project'), phase: headers.indexOf('Phase'),
    category: headers.indexOf('Category'), date: headers.indexOf('Date'),
    sender: headers.indexOf('Sender'), mail: headers.indexOf('Mail'), summary: headers.indexOf('Summary')
  };
  
  if (colIndices.phase === -1 || colIndices.category === -1) {
    SpreadsheetApp.getUi().alert('⚠️ Missing Columns!\n\nPlease add "Phase" and "Category" columns.');
    return;
  }
  
  const allGrouped = groupEmailsByTwoLevels(rows, colIndices);
  const activeGrouped = filterEmailsByActivePeriod(allGrouped, config);
  
  let processed = 0, skipped = 0, errors = 0, preserved = 0;
  
  Object.keys(activeGrouped).forEach(project => {
    Object.keys(activeGrouped[project]).forEach(phase => {
      Object.keys(activeGrouped[project][phase]).forEach(category => {
        const emails = activeGrouped[project][phase][category];
        const hash = generateEmailGroupHash(project, phase, category, emails);
        const key = `${project}|${phase}|${category}`;
        
        if (isAlreadyProcessed(hash)) {
          skipped++;
          if (existingSummaries[key]) {
            const mostRecentDate = getMostRecentEmailDate(emails);
            existingSummaries[key].status = calculateStatus(mostRecentDate, config);
            existingSummaries[key].time_period = getTimePeriod(mostRecentDate);
          }
          return;
        }
        
        try {
          const startTime = Date.now();
          const summary = generateAISummary(project, phase, category, emails, config);
          const processingTime = (Date.now() - startTime) / 1000;
          const mostRecentDate = getMostRecentEmailDate(emails);
          const status = calculateStatus(mostRecentDate, config);
          
          existingSummaries[key] = {
            project: project, phase: phase, category: category, email_count: emails.length,
            time_period: getTimePeriod(mostRecentDate), status: status,
            executive_summary: summary.executive, key_points: summary.keyPoints,
            action_items: summary.actionItems, completed_items: summary.completedItems,
            risk_areas: summary.risks, next_steps: summary.nextSteps,
            
            // MAP THE NEW KPI VALUES FROM THE AI:
            civil_works_pct: summary.civil_works_pct || 0,
            pv_ramming_pct: summary.pv_ramming_pct || 0,
            pv_mounting_pct: summary.pv_mounting_pct || 0,
            bess_pct: summary.bess_pct || 0,
            electrical_pct: summary.electrical_pct || 0,
            commissioning_pct: summary.commissioning_pct || 0,
            
            email_hash: hash, ai_model_used: config.default_model,
            tokens_used: summary.tokensUsed || 0, processing_time_sec: processingTime,
            last_updated: new Date(), archive_date: status === 'Archived' ? new Date() : '',
            processing_status: 'Success'
          };
          
          updateProcessingLog(hash, project, `${phase} - ${category}`, mostRecentDate, emails.length, config.default_model, summary.tokensUsed || 0, 'Success');
          processed++;
          SpreadsheetApp.flush();
          Utilities.sleep(1000);
          
        } catch (error) {
          existingSummaries[key] = {
            project: project, phase: phase, category: category, email_count: emails.length,
            time_period: '', status: 'Error', executive_summary: 'Error generating summary',
            key_points: '', action_items: '', completed_items: '', risk_areas: '', next_steps: '',
            civil_works_pct: 0, pv_ramming_pct: 0, pv_mounting_pct: 0, bess_pct: 0, electrical_pct: 0, commissioning_pct: 0,
            email_hash: hash, ai_model_used: config.default_model, tokens_used: 0,
            processing_time_sec: 0, last_updated: new Date(), archive_date: '', processing_status: 'Error: ' + error.message
          };
          errors++;
        }
      });
    });
  });
  
  Object.keys(allGrouped).forEach(project => {
    Object.keys(allGrouped[project]).forEach(phase => {
      Object.keys(allGrouped[project][phase]).forEach(category => {
        const key = `${project}|${phase}|${category}`;
        if (!activeGrouped[project] || !activeGrouped[project][phase] || !activeGrouped[project][phase][category]) {
          if (existingSummaries[key]) {
            const mostRecentDate = getMostRecentEmailDate(allGrouped[project][phase][category]);
            existingSummaries[key].status = calculateStatus(mostRecentDate, config);
            existingSummaries[key].time_period = getTimePeriod(mostRecentDate);
            if (existingSummaries[key].status === 'Archived' && !existingSummaries[key].archive_date) {
              existingSummaries[key].archive_date = new Date();
            }
            preserved++;
          }
        }
      });
    });
  });
  
  writeSummariesToSheet(summarySheet, existingSummaries);
  config.last_processing_date = new Date().toISOString();
  saveConfig(config);

  // Auto-update Projects sheet from the freshly written summaries
  updateProjectStatuses();

  SpreadsheetApp.getUi().alert(`✅ Complete!\nProcessed: ${processed}\nSkipped: ${skipped}\nPreserved: ${preserved}\nErrors: ${errors}`);
}

function processAllEmailsForce() {
  const ui = SpreadsheetApp.getUi();
  const response = ui.alert(
    'Force Reprocess All?',
    'This regenerates ALL summaries.\nContinue?',
    ui.ButtonSet.YES_NO
  );
  
  if (response !== ui.Button.YES) return;
  
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const logSheet = ss.getSheetByName(PROCESSING_LOG_SHEET_NAME);
  if (logSheet && logSheet.getLastRow() > 1) {
    logSheet.getRange(2, 1, logSheet.getLastRow() - 1, logSheet.getLastColumn()).clear();
  }

    // Clear the summary sheet to force regeneration of ALL summaries
      const summarySheet = ss.getSheetByName(SUMMARY_SHEET_NAME);
        if (summarySheet && summarySheet.getLastRow() > 1) {
            summarySheet.getRange(2, 1, summarySheet.getLastRow() - 1, summarySheet.getLastColumn()).clear();
              }
  
  processEmailsSmart();
}

function groupEmailsByTwoLevels(rows, colIndices) {
  const grouped = {};
  
  rows.forEach(row => {
    const project = row[colIndices.project];
    const phase = row[colIndices.phase];
    const category = row[colIndices.category];
    
    if (!project || !phase || !category) return;
    
    // Create 3-level structure: Project → Phase → Category
    if (!grouped[project]) {
      grouped[project] = {};
    }
    
    if (!grouped[project][phase]) {
      grouped[project][phase] = {};
    }
    
    if (!grouped[project][phase][category]) {
      grouped[project][phase][category] = [];
    }
    
    grouped[project][phase][category].push({
      date: row[colIndices.date],
      sender: row[colIndices.sender],
      mail: row[colIndices.mail],
      summary: row[colIndices.summary]
    });
  });
  
  return grouped;
}
