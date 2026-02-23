function setupSummarySheet() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  let summarySheet = ss.getSheetByName(SUMMARY_SHEET_NAME);
  
  if (!summarySheet) {
    summarySheet = ss.insertSheet(SUMMARY_SHEET_NAME);
    const headers = [
      'Project', 'Phase', 'Category', 'Email Count', 'Time Period', 'Status',
      'Executive Summary', 'Key Points', 'Action Items', 'Completed Items', 'Risk Areas', 'Next Steps',
      'Civil Works Pct', 'PV Ramming Pct', 'PV Mounting Pct', 'BESS Pct', 'Electrical Pct', 'Commissioning Pct', // <-- 6 NEW COLUMNS
      'Email Hash', 'AI Model Used', 'Tokens Used', 'Processing Time (sec)', 'Last Updated', 'Archive Date', 'Processing Status'
    ];
    summarySheet.getRange(1, 1, 1, headers.length).setValues([headers]);
    summarySheet.getRange(1, 1, 1, headers.length).setFontWeight('bold').setBackground('#667eea').setFontColor('#ffffff');
    summarySheet.setFrozenRows(1);
  }
  return summarySheet;
}

function setupProcessingLogSheet() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  let logSheet = ss.getSheetByName(PROCESSING_LOG_SHEET_NAME);
  
  if (!logSheet) {
    logSheet = ss.insertSheet(PROCESSING_LOG_SHEET_NAME);
    
    const headers = [
      'Email Hash', 'Project', 'Category', 'Email Date', 'Email Count',
      'First Processed', 'Last Processed', 'Process Count', 'Status',
      'Model Used', 'Tokens Used', 'Error Message'
    ];
    
    logSheet.getRange(1, 1, 1, headers.length).setValues([headers]);
    logSheet.getRange(1, 1, 1, headers.length)
      .setFontWeight('bold')
      .setBackground('#667eea')
      .setFontColor('#ffffff');
    
    logSheet.setFrozenRows(1);
  }
  
  return logSheet;
}

function setupAllSheets() {
  setupSummarySheet();
  setupProcessingLogSheet();
  setupProjectsSheet();
  getConfig();

  SpreadsheetApp.getUi().alert('✅ All sheets set up successfully!');
}

// ============================================
// PROJECTS SHEET SETUP
// ============================================

function setupProjectsSheet() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  let projectsSheet = ss.getSheetByName('Projects');

  if (!projectsSheet) {
    projectsSheet = ss.insertSheet('Projects');
    const headers = [
      'Project', 'Status', 'Location', 'Capacity_MW',
      'Dev_Stage_Index',
      'Civil_Works_Pct', 'PV_Ramming_Pct', 'PV_Mounting_Pct',
      'BESS_Pct', 'Electrical_Pct', 'Commissioning_Pct',
      'Operation_Status', 'Last_Updated'
    ];
    projectsSheet.getRange(1, 1, 1, headers.length).setValues([headers]);
    projectsSheet.getRange(1, 1, 1, headers.length)
      .setFontWeight('bold')
      .setBackground('#667eea')
      .setFontColor('#ffffff');
    projectsSheet.setFrozenRows(1);
    projectsSheet.autoResizeColumns(1, headers.length);
    Logger.log('Projects sheet created');
  }

  return projectsSheet;
}

// ============================================
// AUTO-UPDATE PROJECT STATUSES FROM AI_SUMMARY
// ============================================

function updateProjectStatuses() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const projectsSheet = ss.getSheetByName('Projects');
  const summarySheet = ss.getSheetByName(SUMMARY_SHEET_NAME);

  if (!projectsSheet || projectsSheet.getLastRow() < 2) {
    Logger.log('Projects sheet missing or empty — skipping status update');
    return;
  }
  if (!summarySheet || summarySheet.getLastRow() < 2) {
    Logger.log('AI_Summary sheet empty — skipping status update');
    return;
  }

  // Category → dev stage index mapping (mirrors getDevelopmentStepperHTML)
  const categoryToStageIndex = {
    'Project Acquisition': 0, 'Land & Property': 0,
    'Environmental & ESG': 1, 'Simulations': 1,
    'Grid Connection': 2,
    'Technical Design': 3,
    'Licensing & Permits': 4
  };

  // Read AI_Summary into a usable structure
  const summaryData = summarySheet.getDataRange().getValues();
  const sHeaders = summaryData[0];
  const sCol = {};
  sHeaders.forEach((h, i) => { sCol[h] = i; });

  const summaryRows = summaryData.slice(1);

  // Read Projects sheet
  const projData = projectsSheet.getDataRange().getValues();
  const pHeaders = projData[0];
  const pCol = {};
  pHeaders.forEach((h, i) => { pCol[h] = i; });

  // Update each project row
  for (let r = 1; r < projData.length; r++) {
    const projectName = projData[r][pCol['Project']];
    if (!projectName) continue;

    // Find all AI_Summary rows for this project
    const projRows = summaryRows.filter(row => row[sCol['Project']] === projectName);

    if (projRows.length === 0) continue;

    // --- Development: find highest dev stage index ---
    let maxDevStage = 0;
    projRows.forEach(row => {
      const phase = String(row[sCol['Phase']] || '').toLowerCase();
      if (phase.includes('development')) {
        const cat = row[sCol['Category']];
        const idx = categoryToStageIndex[cat];
        if (idx !== undefined && idx > maxDevStage) {
          maxDevStage = idx;
        }
      }
    });

    // --- Construction: take MAX of each KPI across all construction rows ---
    let maxCivil = 0, maxRamming = 0, maxMounting = 0;
    let maxBess = 0, maxElectrical = 0, maxCommissioning = 0;

    projRows.forEach(row => {
      const phase = String(row[sCol['Phase']] || '').toLowerCase();
      if (phase.includes('construction')) {
        maxCivil        = Math.max(maxCivil,        parseInt(row[sCol['Civil Works Pct']])  || 0);
        maxRamming      = Math.max(maxRamming,      parseInt(row[sCol['PV Ramming Pct']])  || 0);
        maxMounting     = Math.max(maxMounting,     parseInt(row[sCol['PV Mounting Pct']]) || 0);
        maxBess         = Math.max(maxBess,         parseInt(row[sCol['BESS Pct']])        || 0);
        maxElectrical   = Math.max(maxElectrical,   parseInt(row[sCol['Electrical Pct']])  || 0);
        maxCommissioning= Math.max(maxCommissioning,parseInt(row[sCol['Commissioning Pct']])|| 0);
      }
    });

    // Write back to Projects sheet (columns E–M, indices 4–12)
    const rowNum = r + 1; // 1-based sheet row
    projectsSheet.getRange(rowNum, pCol['Dev_Stage_Index'] + 1).setValue(maxDevStage);
    projectsSheet.getRange(rowNum, pCol['Civil_Works_Pct'] + 1).setValue(maxCivil);
    projectsSheet.getRange(rowNum, pCol['PV_Ramming_Pct'] + 1).setValue(maxRamming);
    projectsSheet.getRange(rowNum, pCol['PV_Mounting_Pct'] + 1).setValue(maxMounting);
    projectsSheet.getRange(rowNum, pCol['BESS_Pct'] + 1).setValue(maxBess);
    projectsSheet.getRange(rowNum, pCol['Electrical_Pct'] + 1).setValue(maxElectrical);
    projectsSheet.getRange(rowNum, pCol['Commissioning_Pct'] + 1).setValue(maxCommissioning);
    projectsSheet.getRange(rowNum, pCol['Last_Updated'] + 1).setValue(new Date());

    Logger.log('Updated project: ' + projectName + ' | DevStage: ' + maxDevStage + ' | BESS: ' + maxBess + '%');
  }

  Logger.log('✅ updateProjectStatuses complete');
}

function loadExistingSummaries(summarySheet) {
  const existingSummaries = {};
  if (!summarySheet || summarySheet.getLastRow() < 2) return existingSummaries;
  
  const data = summarySheet.getDataRange().getValues();
  const headers = data[0];
  const headerMap = {};
  headers.forEach((header, idx) => { headerMap[header] = idx; });
  
  for (let i = 1; i < data.length; i++) {
    const row = data[i];
    const project = row[headerMap['Project']];
    const phase = row[headerMap['Phase']] || 'Development';
    const category = row[headerMap['Category']];
    const key = `${project}|${phase}|${category}`;
    
    existingSummaries[key] = {
      project: project, phase: phase, category: category,
      email_count: row[headerMap['Email Count']], time_period: row[headerMap['Time Period']], status: row[headerMap['Status']],
      executive_summary: row[headerMap['Executive Summary']], key_points: row[headerMap['Key Points']],
      action_items: row[headerMap['Action Items']], completed_items: row[headerMap['Completed Items']],
      risk_areas: row[headerMap['Risk Areas']], next_steps: row[headerMap['Next Steps']],
      
      civil_works_pct: row[headerMap['Civil Works Pct']] || 0,
      pv_ramming_pct: row[headerMap['PV Ramming Pct']] || 0,
      pv_mounting_pct: row[headerMap['PV Mounting Pct']] || 0,
      bess_pct: row[headerMap['BESS Pct']] || 0,
      electrical_pct: row[headerMap['Electrical Pct']] || 0,
      commissioning_pct: row[headerMap['Commissioning Pct']] || 0,
      
      email_hash: row[headerMap['Email Hash']], ai_model_used: row[headerMap['AI Model Used']],
      tokens_used: row[headerMap['Tokens Used']], processing_time_sec: row[headerMap['Processing Time (sec)']],
      last_updated: row[headerMap['Last Updated']], archive_date: row[headerMap['Archive Date']],
      processing_status: row[headerMap['Processing Status']]
    };
  }
  return existingSummaries;
}

function writeSummariesToSheet(summarySheet, summariesMap) {
  const lastRow = summarySheet.getLastRow();
  if (lastRow > 1) {
    summarySheet.getRange(2, 1, lastRow - 1, summarySheet.getLastColumn()).clear();
  }
  
  const summariesArray = Object.values(summariesMap).map(s => [
    s.project,                      // A
    s.phase,                        // B
    s.category,                     // C
    s.email_count,                  // D
    s.time_period,                  // E
    s.status,                       // F
    s.executive_summary,            // G
    s.key_points,                   // H
    s.action_items,                 // I
    s.completed_items,              // J
    s.risk_areas,                   // K
    s.next_steps,                   // L
    
    // THE 6 PERCENTAGE COLUMNS (M-R)
    s.civil_works_pct || 0,         // M - Civil Works Pct
    s.pv_ramming_pct || 0,          // N - PV Ramming Pct
    s.pv_mounting_pct || 0,         // O - PV Mounting Pct
    s.bess_pct || 0,                // P - BESS Pct
    s.electrical_pct || 0,          // Q - Electrical Pct
    s.commissioning_pct || 0,       // R - Commissioning Pct
    
    // METADATA COLUMNS (S-Y)
    s.email_hash,                   // S - Email Hash
    s.ai_model_used,                // T - AI Model Used
    s.tokens_used,                  // U - Tokens Used
    s.processing_time_sec,          // V - Processing Time (sec)
    s.last_updated,                 // W - Last Updated
    s.archive_date,                 // X - Archive Date
    s.processing_status             // Y - Processing Status
  ]);
  
  // DIAGNOSTIC LOGGING
  if (summariesArray.length > 0) {
    Logger.log('=== DIAGNOSTIC INFO ===');
    Logger.log('Number of summaries: ' + summariesArray.length);
    Logger.log('Number of columns per row: ' + summariesArray[0].length);
    Logger.log('Expected: 25 columns (A-Y)');
    Logger.log('First row sample:');
    Logger.log('  Project: ' + summariesArray[0][0]);
    Logger.log('  Phase: ' + summariesArray[0][1]);
    Logger.log('  Category: ' + summariesArray[0][2]);
    Logger.log('  Civil Works Pct (col M): ' + summariesArray[0][12]);
    Logger.log('  Email Hash (col S): ' + summariesArray[0][18]);
    Logger.log('======================');
    
    summarySheet.getRange(2, 1, summariesArray.length, summariesArray[0].length)
      .setValues(summariesArray);
    formatSummarySheet(summarySheet);
  }
  
  Logger.log('Wrote ' + summariesArray.length + ' summaries to sheet with ' + 
             (summariesArray.length > 0 ? summariesArray[0].length : 0) + ' columns each');
}

function formatSummarySheet(sheet) {
  const lastRow = sheet.getLastRow();
  if (lastRow < 2) return;
  
  sheet.setColumnWidths(1, 8, 120);
  sheet.getRange(2, 6, lastRow - 1, 6).setWrap(true);
  
  const statusRange = sheet.getRange(2, 5, lastRow - 1, 1);
  
  const rules = [
    SpreadsheetApp.newConditionalFormatRule()
      .whenTextEqualTo('Active').setBackground('#d4edda').setRanges([statusRange]).build(),
    SpreadsheetApp.newConditionalFormatRule()
      .whenTextEqualTo('Recent').setBackground('#fff3cd').setRanges([statusRange]).build(),
    SpreadsheetApp.newConditionalFormatRule()
      .whenTextEqualTo('Archived').setBackground('#f8d7da').setRanges([statusRange]).build()
  ];
  
  sheet.setConditionalFormatRules(rules);
}
