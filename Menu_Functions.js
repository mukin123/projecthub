function onOpen() {
  const ui = SpreadsheetApp.getUi();
  ui.createMenu('📧 Email Processor')
    .addItem('⚙️ Setup All Sheets', 'setupAllSheets')
    .addSeparator()
    .addItem('🔑 Set OpenRouter API Key', 'showApiKeyDialog')
    .addItem('🎛️ View Configuration', 'showConfigDialog')
    .addSeparator()
    .addItem('⚡ Smart Process (Incremental)', 'processEmailsSmart')
    .addItem('🔄 Force Reprocess All', 'processAllEmailsForce')
    .addSeparator()
    .addItem('📊 View Statistics', 'showStatistics')
    .addItem('🌐 View Web App URL', 'showWebAppUrl')
//    .addItem('📤 Process Sent Emails Now', 'processSentEmailsAI')
    .addToUi();

}

function showApiKeyDialog() {
  const ui = SpreadsheetApp.getUi();
  const config = getConfig();

  const result = ui.prompt(
    'Set OpenRouter API Key',
    'Enter your OpenRouter API key:\n\n' +
    'Current: ' + (config.openrouter_api_key ? '***' + config.openrouter_api_key.slice(-4) : 'Not set'),
    ui.ButtonSet.OK_CANCEL
  );

  if (result.getSelectedButton() === ui.Button.OK) {
    config.openrouter_api_key = result.getResponseText().trim();
    saveConfig(config);
    ui.alert('✅ API Key saved!');
  }
}

function showConfigDialog() {
  const ui = SpreadsheetApp.getUi();
  const config = getConfig();

  ui.alert(
    'Configuration',
    `Active Period: ${config.active_period_months} months
Archive After: ${config.archive_threshold_months} months
Model: ${config.default_model}

Edit in Config sheet or via web interface.`,
    ui.ButtonSet.OK
  );
}

function showStatistics() {
  const response = getProcessingStats();
  const result = JSON.parse(response.getContent());
  const s = result.stats;

  SpreadsheetApp.getUi().alert(
    'Statistics',
    `Total: ${s.totalCategories} | Active: ${s.activeCategories}
Recent: ${s.recentCategories} | Archived: ${s.archivedCategories}

Emails: ${s.totalEmails} | Tokens: ${s.totalTokens}
Cost: $${s.estimatedCost.toFixed(4)}`,
    SpreadsheetApp.getUi().ButtonSet.OK
  );
}

function showWebAppUrl() {
  const url = ScriptApp.getService().getUrl();

  SpreadsheetApp.getUi().alert(
    'Web App URL:\n' +
    'Your all-in-one platform URL:\n\n' + url + '\n\n' +
    'This URL serves everything:\n' +
    '- Frontend interface\n' +
    '- Backend API\n' +
    '- Setup guide\n\n' +
    'Just bookmark and share this URL!',
    SpreadsheetApp.getUi().ButtonSet.OK
  );
}
