// ============================================
// ALL-IN-ONE EMAIL INTELLIGENCE PLATFORM v3.0
// Backend API + Frontend HTML + Setup Guide
// Single URL for everything!
// ============================================

// Sheet names
const LOG_SHEET_NAME = 'Mail_Register';
const SUMMARY_SHEET_NAME = 'AI_Summary';
const CONFIG_SHEET_NAME = 'Config';
const PROCESSING_LOG_SHEET_NAME = 'Processing_Log';

// ============================================
// CONFIGURATION MANAGEMENT
// ============================================

function doGet(e) {
  const action = e.parameter.action;
  
  if (action === 'getSummaries') {
    return getSummariesJSON(e);
  }
  
  // NEW: Add this block for email links
  if (action === 'getEmails') {
    return getEmailsJSON();
  }
  
  // Add this NEW block
if (action === 'getCategoryReference') {
  return getCategoryReferenceJSON();
}

  if (action === 'getProjects') {
    return getProjectsJSON();
  }

  // Default: return HTML
  return HtmlService.createHtmlOutput(getHTML())
    .setTitle('Email Intelligence Platform')
    .setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL);
}

function getConfig() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  let configSheet = ss.getSheetByName(CONFIG_SHEET_NAME);
  
  const defaults = {
    ai_provider: 'openrouter',
    openrouter_api_key: '',
    default_model: 'anthropic/claude-3-haiku',
    active_period_months: 3,
    recent_period_months: 6,
    archive_threshold_months: 6,
    auto_archive_enabled: true,
    archive_compression_enabled: false,
    processing_mode: 'smart_incremental',
    last_full_run: new Date().toISOString(),
    last_processing_date: new Date().toISOString()
  };
  
  if (!configSheet) {
    configSheet = createConfigSheet(defaults);
  }
  
  const data = configSheet.getDataRange().getValues();
  const config = {};
  
  for (let i = 1; i < data.length; i++) {
    const key = data[i][0];
    let value = data[i][1];
    
    if (key.includes('months') || key.includes('period')) {
      value = parseInt(value) || defaults[key];
    } else if (key.includes('enabled')) {
      value = value === true || value === 'TRUE' || value === 'true' || value === 'yes';
    }
    
    config[key] = value;
  }
  
  Object.keys(defaults).forEach(key => {
    if (config[key] === undefined || config[key] === '') {
      config[key] = defaults[key];
    }
  });
  
  return config;
}

function saveConfig(config) {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  let configSheet = ss.getSheetByName(CONFIG_SHEET_NAME);
  
  if (!configSheet) {
    configSheet = createConfigSheet(config);
    return;
  }
  
  const data = [['Setting', 'Value']];
  Object.keys(config).forEach(key => {
    data.push([key, config[key]]);
  });
  
  configSheet.clear();
  configSheet.getRange(1, 1, data.length, 2).setValues(data);
  formatConfigSheet(configSheet);
  
  Logger.log('Configuration saved successfully');
}

function createConfigSheet(defaults) {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const configSheet = ss.insertSheet(CONFIG_SHEET_NAME);
  
  const data = [['Setting', 'Value']];
  Object.keys(defaults).forEach(key => {
    data.push([key, defaults[key]]);
  });
  
  configSheet.getRange(1, 1, data.length, 2).setValues(data);
  formatConfigSheet(configSheet);
  
  return configSheet;
}

function formatConfigSheet(sheet) {
  sheet.getRange(1, 1, 1, 2)
    .setFontWeight('bold')
    .setBackground('#667eea')
    .setFontColor('#ffffff');
  sheet.autoResizeColumns(1, 2);
  sheet.setColumnWidth(1, 250);
  sheet.setColumnWidth(2, 300);
}