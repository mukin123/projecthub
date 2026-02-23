// ============================================
// FILE 7 of 9: HTML_Template.gs
// PURPOSE: HTML Structure & Template
// ============================================

function getHTML() {
  const scriptUrl = ScriptApp.getService().getUrl();

  return `<!DOCTYPE html>
<html>
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>Email Intelligence Platform</title>
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Archivo:wght@400;500;600;700&family=JetBrains+Mono:wght@400;500&display=swap" rel="stylesheet">
<style>
${getCSS()}
</style>
</head>
<body>
${getHTMLBody()}
<script>
const SCRIPT_URL = "${scriptUrl}";
${getJavaScript()}
</script>
</body>
</html>`;
}

function getHTMLBody() {
  return `<div class="container">

  <!-- Header -->
  <div class="header">
    <div class="header-content">
      <div class="logo">
        <div class="logo-icon">📧</div>
        <div class="logo-text">
          <h1>Email Intelligence</h1>
          <p>Project Management Platform</p>
        </div>
      </div>
    </div>
    <div style="display:flex;gap:12px;">
      <button class="theme-toggle" id="refreshBtn" title="Refresh">🔄</button>
      <button class="theme-toggle" id="taskViewBtn" title="Master Action Items">📋</button>
      <button class="theme-toggle" id="themeToggle" title="Toggle dark / light mode">
        <span id="themeIcon">🌙</span>
      </button>
    </div>
  </div>

  <!-- Filter Bar -->
  <div class="filters" id="mainFilters">
    <div class="filter-group">
      <label>Time Period</label>
      <select id="timeFilter">
        <option value="1">Last Month</option>
        <option value="3">Last 3 Months</option>
        <option value="6">Last 6 Months</option>
        <option value="12">Last 12 Months</option>
        <option value="all">All Time</option>
      </select>
    </div>
    <!-- PROJECT dropdown hidden — use project chip bar below -->
    <div class="filter-group hidden">
      <label>Project</label>
      <select id="projectSelect"><option value="">All Projects</option></select>
    </div>
    <div class="filter-group">
      <label>Phase</label>
      <select id="phaseFilter"><option value="">All Phases</option></select>
    </div>
    <div class="filter-group">
      <label>Category</label>
      <select id="categoryFilter"><option value="">All Categories</option></select>
    </div>
    <div class="filter-group">
      <label>Status</label>
      <select id="statusFilter">
        <option value="">All</option>
        <option value="Active">Active</option>
        <option value="Recent">Recent</option>
        <option value="Archived">Archived</option>
      </select>
    </div>
  </div>

  <!-- Project Chip Bar -->
  <div class="project-bar-wrapper" id="projectBarWrapper">
    <div id="projectBar" class="project-bar">
      <button class="project-chip active" data-project="">All Projects</button>
    </div>
  </div>

  <!-- Main Content: sidebar | detail | right-panel -->
  <div class="main-content" id="mainContent">

    <!-- Master Task View (spans all columns when active) -->
    <div id="masterTaskView">
      <div class="master-task-header">
        <h2>Master Action Items</h2>
        <span id="taskCount" class="task-status todo">0 Pending</span>
      </div>
      <div class="filters" style="margin-bottom:20px;">
        <div class="filter-group">
          <label>Project</label>
          <select id="masterProjectFilter"><option value="">All Projects</option></select>
        </div>
        <div class="filter-group">
          <label>Phase</label>
          <select id="masterPhaseFilter"><option value="">All Phases</option></select>
        </div>
        <div class="filter-group">
          <label>Category</label>
          <select id="masterCategoryFilter"><option value="">All Categories</option></select>
        </div>
      </div>
      <div class="master-tasks-table-wrapper">
        <table class="master-tasks-table" id="masterTaskTable">
          <thead>
            <tr>
              <th data-sort="project" style="cursor:pointer;" title="Sort">Project ↕️</th>
              <th data-sort="phase" style="cursor:pointer;" title="Sort">Phase ↕️</th>
              <th data-sort="category" style="cursor:pointer;" title="Sort">Category ↕️</th>
              <th data-sort="description" style="cursor:pointer;" title="Sort">Task Description ↕️</th>
              <th data-sort="owner" style="cursor:pointer;" title="Sort">Owner ↕️</th>
              <th data-sort="deadline" style="cursor:pointer;" title="Sort">Deadline ↕️</th>
            </tr>
          </thead>
          <tbody id="masterTasksTableBody"></tbody>
        </table>
      </div>
    </div>

    <!-- Email Card Sidebar -->
    <div class="sidebar" id="sidebar">
      <div class="loading">Loading...</div>
    </div>

    <!-- Email Detail Panel -->
    <div class="detail-panel" id="detailPanel">
      <div class="empty-state" style="padding:120px 40px;">
        Select a card to view details
      </div>
    </div>

    <!-- Project Right Panel (shown when a project chip is selected) -->
    <div id="projectDashboard" class="project-right-panel" style="display:none;">
      <div class="panel-header">
        <span class="panel-project-name" id="panelProjectName"></span>
        <span class="collapsed-hint" onclick="toggleProjectPanel()">KPIs</span>
        <button class="panel-collapse-btn" id="panelCollapseBtn" onclick="toggleProjectPanel()" title="Collapse panel">‹</button>
      </div>
      <div class="panel-body" id="panelBody"></div>
    </div>

  </div>
</div>`;
}
