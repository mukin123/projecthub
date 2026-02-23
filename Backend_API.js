function getSummariesJSON(e) {
  try {
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    const summarySheet = ss.getSheetByName(SUMMARY_SHEET_NAME);
    
    if (!summarySheet) {
      return ContentService.createTextOutput(JSON.stringify({
        success: false,
        error: 'Summary sheet not found. Please run processing first.'
      })).setMimeType(ContentService.MimeType.JSON);
    }
    
    const lastRow = summarySheet.getLastRow();
    
    if (lastRow < 2) {
      return ContentService.createTextOutput(JSON.stringify({
        success: false,
        error: 'No data in summary sheet. Please run processing first.'
      })).setMimeType(ContentService.MimeType.JSON);
    }
    
    const data = summarySheet.getDataRange().getValues();
    const headers = data[0];
    const rows = data.slice(1);
    
    const jsonData = rows.map(row => {
      const obj = {};
      headers.forEach((header, idx) => {
        obj[header.toLowerCase().replace(/ /g, '_').replace(/[()]/g, '')] = row[idx];
      });
      return obj;
    });
    
    let filtered = jsonData;
    const params = (e && e.parameter) ? e.parameter : {};
    if (params.project) {
      filtered = filtered.filter(item => item.project === params.project);
    }
    if (params.status) {
      filtered = filtered.filter(item => item.status === params.status);
    }
    
    return ContentService.createTextOutput(JSON.stringify({
      success: true,
      data: filtered,
      timestamp: new Date().toISOString()
    })).setMimeType(ContentService.MimeType.JSON);
    
  } catch (error) {
    return ContentService.createTextOutput(JSON.stringify({
      success: false,
      error: error.toString()
    })).setMimeType(ContentService.MimeType.JSON);
  }
}

function getEmailsJSON() {
  try {
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    const mailSheet = ss.getSheetByName('Mail_Register');
    
    if (!mailSheet) {
      return ContentService.createTextOutput(
        JSON.stringify({ success: false, error: 'Mail_Register sheet not found' })
      ).setMimeType(ContentService.MimeType.JSON);
    }
    
    const data = mailSheet.getDataRange().getValues();
    const headers = data[0];
    const emails = [];
    
    // Find column indices
    const projectCol = headers.indexOf('Project');
    const phaseCol = headers.indexOf('Phase');
    const categoryCol = headers.indexOf('Category');
    const dateCol = headers.indexOf('Date');
    const senderCol = headers.indexOf('Sender');
    const mailCol = headers.indexOf('Mail');
    
    // Process each row (skip header)
    for (let i = 1; i < data.length; i++) {
      const row = data[i];
      
      emails.push({
        project: row[projectCol] || '',
        phase: row[phaseCol] || '',
        category: row[categoryCol] || '',
        date: row[dateCol] || '',
        sender: row[senderCol] || '',
        mail: row[mailCol] || ''
      });
    }
    
    return ContentService.createTextOutput(
      JSON.stringify({ success: true, data: emails })
    ).setMimeType(ContentService.MimeType.JSON);
    
  } catch (error) {
    return ContentService.createTextOutput(
      JSON.stringify({ success: false, error: error.toString() })
    ).setMimeType(ContentService.MimeType.JSON);
  }
}

function getProjectsJSON() {
  try {
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    const sheet = ss.getSheetByName('Projects');

    if (!sheet) {
      return ContentService.createTextOutput(JSON.stringify({
        success: true, data: []
      })).setMimeType(ContentService.MimeType.JSON);
    }

    if (sheet.getLastRow() < 2) {
      return ContentService.createTextOutput(JSON.stringify({
        success: true, data: []
      })).setMimeType(ContentService.MimeType.JSON);
    }

    const data = sheet.getDataRange().getValues();
    const headers = data[0];
    const rows = data.slice(1);

    const projects = rows
      .filter(row => row[0]) // skip blank rows
      .map(row => {
        const obj = {};
        headers.forEach((header, idx) => {
          // Normalise key: lowercase, spaces→underscores
          const key = header.toLowerCase().replace(/ /g, '_');
          obj[key] = row[idx];
        });
        return obj;
      });

    return ContentService.createTextOutput(JSON.stringify({
      success: true, data: projects
    })).setMimeType(ContentService.MimeType.JSON);

  } catch (error) {
    return ContentService.createTextOutput(JSON.stringify({
      success: false, error: error.toString()
    })).setMimeType(ContentService.MimeType.JSON);
  }
}

function getCategoryReferenceJSON() {
  try {
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    const refSheet = ss.getSheetByName('Category_Reference');
    
    if (!refSheet) {
      return ContentService.createTextOutput(
        JSON.stringify({ success: false, error: 'Category_Reference sheet not found' })
      ).setMimeType(ContentService.MimeType.JSON);
    }
    
    const data = refSheet.getDataRange().getValues();
    
    if (data.length <= 1) {
      return ContentService.createTextOutput(
        JSON.stringify({ success: true, data: {} })
      ).setMimeType(ContentService.MimeType.JSON);
    }
    
    const headers = data[0];
    const phaseIndex = headers.indexOf('Phase');
    const categoryIndex = headers.indexOf('Category');
    
    // Build a map: { "Phase Name": ["Category1", "Category2", ...] }
    const phaseCategories = {};
    
    for (let i = 1; i < data.length; i++) {
      const row = data[i];
      const phase = row[phaseIndex];
      const category = row[categoryIndex];
      
      if (!phase || !category) continue;
      
      if (!phaseCategories[phase]) {
        phaseCategories[phase] = [];
      }
      
      if (!phaseCategories[phase].includes(category)) {
        phaseCategories[phase].push(category);
      }
    }
    
    return ContentService.createTextOutput(
      JSON.stringify({ 
        success: true, 
        data: phaseCategories 
      })
    ).setMimeType(ContentService.MimeType.JSON);
    
  } catch (error) {
    return ContentService.createTextOutput(
      JSON.stringify({ success: false, error: error.toString() })
    ).setMimeType(ContentService.MimeType.JSON);
  }
}