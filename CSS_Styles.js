// ============================================
// FILE 8 of 9: CSS_Styles.gs
// PURPOSE: All CSS Styling
// ============================================

function getCSS() {
  return `
* { margin: 0; padding: 0; box-sizing: border-box; }

:root {
  --bg-primary: #fafafa;
  --bg-elevated: #ffffff;
  --bg-overlay: rgba(255,255,255,0.95);
  --text-primary: #1a1a1a;
  --text-secondary: #666666;
  --text-tertiary: #999999;
  --border-default: #e5e5e5;
  --border-emphasis: #d4d4d4;
  --accent-primary: #2563eb;
  --accent-hover: #1d4ed8;
  --surface-card: #ffffff;
  --surface-hover: #f5f5f5;
  --status-active: #10b981;
  --status-recent: #f59e0b;
  --status-archived: #6b7280;
  --shadow-sm: 0 1px 2px 0 rgba(0,0,0,0.05);
  --shadow-md: 0 4px 6px -1px rgba(0,0,0,0.1);
  --shadow-lg: 0 10px 15px -3px rgba(0,0,0,0.1);
}

body.dark-mode {
  --bg-primary: #0a0a0a;
  --bg-elevated: #141414;
  --bg-overlay: rgba(20,20,20,0.95);
  --text-primary: #f5f5f5;
  --text-secondary: #a3a3a3;
  --text-tertiary: #737373;
  --border-default: #262626;
  --border-emphasis: #404040;
  --accent-primary: #3b82f6;
  --accent-hover: #60a5fa;
  --surface-card: #171717;
  --surface-hover: #1f1f1f;
  --status-active: #10b981;
  --status-recent: #f59e0b;
  --status-archived: #6b7280;
  --shadow-sm: 0 1px 2px 0 rgba(0,0,0,0.3);
  --shadow-md: 0 4px 6px -1px rgba(0,0,0,0.4);
  --shadow-lg: 0 10px 15px -3px rgba(0,0,0,0.5);
}

body {
  font-family: 'Archivo', -apple-system, BlinkMacSystemFont, sans-serif;
  background: var(--bg-primary);
  color: var(--text-primary);
  min-height: 100vh;
  transition: background-color 0.3s ease, color 0.3s ease;
}

.container {
  max-width: 100%;
  min-height: 100vh;
  display: flex;
  flex-direction: column;
}

/* ============================================ Header */
.header {
  background: var(--bg-elevated);
  border-bottom: 1px solid var(--border-default);
  padding: 12px 20px;
  display: flex;
  justify-content: space-between;
  align-items: center;
  position: sticky;
  top: 0;
  z-index: 100;
  backdrop-filter: blur(8px);
}

.header-content { display: flex; align-items: center; gap: 16px; }

.logo { display: flex; align-items: center; gap: 8px; }

.logo-icon {
  width: 32px; height: 32px;
  background: var(--accent-primary);
  border-radius: 6px;
  display: flex; align-items: center; justify-content: center;
  font-size: 18px;
}

.logo-text h1 { font-size: 16px; font-weight: 600; color: var(--text-primary); letter-spacing: -0.02em; }
.logo-text p { font-size: 11px; color: var(--text-tertiary); font-weight: 400; margin-top: 1px; }

.theme-toggle {
  background: var(--surface-card);
  border: 1px solid var(--border-default);
  color: var(--text-secondary);
  width: 36px; height: 36px;
  border-radius: 6px;
  cursor: pointer;
  display: flex; align-items: center; justify-content: center;
  font-size: 16px;
  transition: all 0.2s;
  position: relative;
}

.theme-toggle:hover { background: var(--surface-hover); border-color: var(--border-emphasis); }

/* Tooltip */
.theme-toggle[title]:hover::after {
  content: attr(title);
  position: absolute;
  bottom: -34px; left: 50%;
  transform: translateX(-50%);
  background: #1a1a1a; color: white;
  font-size: 11px; padding: 4px 8px;
  border-radius: 4px; white-space: nowrap;
  z-index: 200; pointer-events: none;
}
body.dark-mode .theme-toggle[title]:hover::after { background: #404040; }

/* ============================================ Filters */
.filters {
  background: var(--bg-elevated);
  border-bottom: 1px solid var(--border-default);
  padding: 16px 20px;
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(140px, 1fr));
  gap: 12px;
}

.filter-group label {
  display: block; font-size: 11px; font-weight: 600;
  text-transform: uppercase; letter-spacing: 0.05em;
  color: var(--text-tertiary); margin-bottom: 6px;
}

.filter-group.hidden { display: none; }

select, button.refresh-btn {
  width: 100%; padding: 8px 12px;
  background: var(--surface-card);
  border: 1px solid var(--border-default);
  border-radius: 6px; color: var(--text-primary);
  font-size: 13px; font-family: inherit; transition: all 0.15s;
}

select:hover, select:focus { border-color: var(--border-emphasis); outline: none; }

button.refresh-btn {
  background: var(--accent-primary); color: white;
  border: none; font-weight: 500; cursor: pointer;
}
button.refresh-btn:hover { background: var(--accent-hover); }

/* ============================================ Project Bar */
.project-bar-wrapper {
  background: var(--bg-elevated);
  border-bottom: 1px solid var(--border-default);
  position: relative;
}

.project-bar {
  padding: 10px 20px;
  display: flex; gap: 8px;
  overflow-x: auto; align-items: center;
  flex-wrap: nowrap;
  scrollbar-width: none;
}
.project-bar::-webkit-scrollbar { display: none; }

/* Right fade to indicate more chips */
.project-bar-wrapper::after {
  content: '';
  position: absolute; right: 0; top: 0; bottom: 0;
  width: 60px;
  background: linear-gradient(to right, transparent, var(--bg-elevated));
  pointer-events: none; z-index: 1;
}

.project-chip {
  padding: 5px 14px; border-radius: 20px;
  border: 1px solid var(--border-emphasis);
  background: var(--surface-card);
  color: var(--text-secondary);
  font-size: 12px; font-weight: 600;
  cursor: pointer; white-space: nowrap;
  transition: all 0.15s; font-family: inherit; flex-shrink: 0;
}
.project-chip:hover { border-color: var(--accent-primary); color: var(--accent-primary); }
.project-chip.active { background: var(--accent-primary); border-color: var(--accent-primary); color: white; }

/* ============================================ Main Layout */
.main-content {
  flex: 1; display: grid;
  grid-template-columns: 360px 1fr;
  gap: 0; min-height: 0;
}

.main-content.has-project-panel {
  grid-template-columns: 360px 1fr 300px;
}

/* ============================================ Sidebar */
.sidebar {
  background: var(--bg-elevated);
  border-right: 1px solid var(--border-default);
  overflow-y: auto;
  height: calc(100vh - 120px);
}

.card { padding: 16px 20px; border-bottom: 1px solid var(--border-default); cursor: pointer; transition: all 0.15s; }
.card:hover { background: var(--surface-hover); }
.card.selected { background: var(--surface-hover); border-left: 3px solid var(--accent-primary); }

.card-header { display: flex; align-items: flex-start; gap: 10px; margin-bottom: 8px; }

.card-status {
  width: 8px; height: 8px; border-radius: 50%; flex-shrink: 0; margin-top: 6px;
}

/* Phase-based dot colors */
.card-status.development { background: #3b82f6; }
.card-status.construction { background: #f97316; }
.card-status.financing { background: #a855f7; }
.card-status.operations { background: var(--status-active); }
.card-status.general-corporate { background: var(--status-archived); }
.card-status.active { background: var(--status-active); }
.card-status.recent { background: var(--status-recent); }
.card-status.archived { background: var(--status-archived); }

.card-title { font-size: 13px; font-weight: 600; color: var(--text-primary); line-height: 1.4; flex: 1; }

.card-meta {
  display: flex; gap: 12px; margin-top: 8px;
  font-size: 11px; color: var(--text-tertiary);
  font-family: 'JetBrains Mono', monospace; align-items: center;
}

.card-badge {
  display: inline-flex; align-items: center; gap: 4px;
  padding: 2px 8px; border-radius: 4px;
  font-size: 10px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.05em;
}

/* Phase-based badge colors */
.card-badge.development { background: rgba(59,130,246,0.12); color: #3b82f6; }
.card-badge.construction { background: rgba(249,115,22,0.12); color: #f97316; }
.card-badge.financing { background: rgba(168,85,247,0.12); color: #a855f7; }
.card-badge.operations { background: rgba(16,185,129,0.12); color: var(--status-active); }
.card-badge.general-corporate { background: rgba(107,114,128,0.12); color: var(--status-archived); }
.card-badge.active { background: rgba(16,185,129,0.1); color: var(--status-active); }
.card-badge.recent { background: rgba(245,158,11,0.1); color: var(--status-recent); }
.card-badge.archived { background: rgba(107,114,128,0.1); color: var(--status-archived); }

/* ============================================ Horizontal Stepper (standalone) */
.stepper-container {
  padding: 32px 24px 24px;
  background: var(--bg-elevated);
  border-bottom: 1px solid var(--border-default);
  display: flex; justify-content: space-between; position: relative;
}

.stepper-line {
  position: absolute; top: 48px; left: 10%; right: 10%;
  height: 2px; background: var(--border-default); z-index: 1;
}
.stepper-line-fill {
  position: absolute; top: 48px; left: 10%;
  height: 2px; background: var(--accent-primary); z-index: 2; transition: width 0.4s ease;
}
.step {
  position: relative; z-index: 3;
  display: flex; flex-direction: column; align-items: center; gap: 8px; width: 20%;
}
.step-circle {
  width: 32px; height: 32px; border-radius: 50%;
  background: var(--bg-elevated); border: 2px solid var(--border-emphasis);
  display: flex; align-items: center; justify-content: center;
  font-size: 14px; color: var(--text-tertiary); transition: all 0.3s;
}
.step.completed .step-circle { background: var(--status-active); border-color: var(--status-active); color: white; }
.step.active .step-circle { border-color: var(--accent-primary); color: var(--accent-primary); box-shadow: 0 0 0 4px rgba(59,130,246,0.15); background: var(--bg-elevated); }
.step-label { font-size: 11px; font-weight: 600; color: var(--text-tertiary); text-align: center; text-transform: uppercase; }
.step.completed .step-label { color: var(--text-primary); }
.step.active .step-label { color: var(--accent-primary); }

/* ============================================ Vertical Stepper (right panel) */
.stepper-vertical { display: flex; flex-direction: column; gap: 0; }

.step-v { display: flex; align-items: flex-start; gap: 10px; }

.step-v-left {
  display: flex; flex-direction: column; align-items: center;
  width: 22px; flex-shrink: 0;
}
.step-v-circle {
  width: 22px; height: 22px; border-radius: 50%;
  background: var(--bg-elevated); border: 2px solid var(--border-emphasis);
  display: flex; align-items: center; justify-content: center;
  font-size: 10px; color: var(--text-tertiary); flex-shrink: 0; transition: all 0.3s;
}
.step-v.completed .step-v-circle { background: var(--status-active); border-color: var(--status-active); color: white; }
.step-v.active .step-v-circle { border-color: var(--accent-primary); color: var(--accent-primary); box-shadow: 0 0 0 3px rgba(59,130,246,0.15); background: var(--bg-elevated); }

.step-v-line {
  width: 2px; min-height: 14px; flex: 1;
  background: var(--border-default); margin: 2px 0;
}
.step-v.completed .step-v-line { background: var(--status-active); }

.step-v-content { padding: 2px 0 14px 0; flex: 1; }
.step-v:last-child .step-v-content { padding-bottom: 0; }

.step-v-label { font-size: 12px; font-weight: 600; color: var(--text-tertiary); line-height: 1.3; }
.step-v.completed .step-v-label { color: var(--text-primary); }
.step-v.active .step-v-label { color: var(--accent-primary); }

/* ============================================ Construction KPI Dashboard (standalone) */
.construction-dashboard {
  padding: 32px 24px;
  background: var(--bg-elevated); border-bottom: 1px solid var(--border-default);
  display: flex; gap: 40px; align-items: center;
}

.kpi-ring-container {
  position: relative; width: 140px; height: 140px; border-radius: 50%;
  background: conic-gradient(var(--accent-primary) var(--progress, 0%), var(--border-default) 0);
  display: flex; align-items: center; justify-content: center;
  flex-shrink: 0; box-shadow: var(--shadow-md);
}
.kpi-ring-inner {
  width: 116px; height: 116px; border-radius: 50%;
  background: var(--bg-elevated);
  display: flex; flex-direction: column; align-items: center; justify-content: center;
}
.kpi-value { font-size: 32px; font-weight: 700; color: var(--text-primary); line-height: 1; margin-bottom: 4px; }
.kpi-label { font-size: 10px; font-weight: 600; color: var(--text-tertiary); text-transform: uppercase; letter-spacing: 0.05em; }

.milestones-grid { display: grid; grid-template-columns: repeat(2, 1fr); gap: 16px 32px; flex: 1; }

.milestone-item {
  display: flex; align-items: center; gap: 10px;
  font-size: 13px; font-weight: 500; color: var(--text-secondary);
}
.milestone-checkbox {
  width: 20px; height: 20px; border-radius: 6px;
  border: 2px solid var(--border-emphasis);
  display: flex; align-items: center; justify-content: center;
  font-size: 12px; color: transparent; transition: all 0.2s;
  background: var(--surface-card); flex-shrink: 0;
}
.milestone-item.done .milestone-checkbox { background: var(--status-active); border-color: var(--status-active); color: white; }
.milestone-item.done span { color: var(--text-primary); }
.milestone-weight {
  font-size: 11px; font-weight: 600; color: var(--text-tertiary);
  background: var(--surface-hover); padding: 2px 8px; border-radius: 12px; margin-left: auto; flex-shrink: 0;
}

/* ============================================ Right Project Panel */
.project-right-panel {
  background: var(--bg-elevated);
  border-left: 1px solid var(--border-default);
  height: calc(100vh - 120px);
  overflow-y: auto; overflow-x: hidden;
  display: flex; flex-direction: column;
  width: 300px;
  transition: width 0.3s ease;
  scrollbar-width: thin;
  scrollbar-color: var(--border-emphasis) transparent;
}
.project-right-panel::-webkit-scrollbar { width: 4px; }
.project-right-panel::-webkit-scrollbar-track { background: transparent; }
.project-right-panel::-webkit-scrollbar-thumb { background: var(--border-emphasis); border-radius: 2px; }

.project-right-panel.collapsed { width: 40px; overflow: hidden; }

.panel-header {
  display: flex; align-items: center; justify-content: space-between;
  padding: 14px 12px 12px;
  border-bottom: 1px solid var(--border-default);
  position: sticky; top: 0; background: var(--bg-elevated); z-index: 5; gap: 8px;
}
.panel-project-name {
  font-size: 12px; font-weight: 700; color: var(--text-primary);
  white-space: nowrap; overflow: hidden; text-overflow: ellipsis; flex: 1;
}
.panel-collapse-btn {
  width: 26px; height: 26px; border-radius: 5px;
  border: 1px solid var(--border-default);
  background: var(--surface-card); color: var(--text-secondary);
  cursor: pointer; display: flex; align-items: center; justify-content: center;
  font-size: 13px; flex-shrink: 0; transition: all 0.2s; font-family: inherit;
}
.panel-collapse-btn:hover { background: var(--surface-hover); border-color: var(--border-emphasis); color: var(--text-primary); }

.project-right-panel.collapsed .panel-project-name { display: none; }

.collapsed-hint {
  display: none; writing-mode: vertical-rl;
  font-size: 10px; font-weight: 700; color: var(--text-tertiary);
  padding: 12px 0; cursor: pointer;
  letter-spacing: 0.08em; text-transform: uppercase; text-align: center; width: 100%;
}
.project-right-panel.collapsed .collapsed-hint { display: block; }

.panel-body { padding: 0; flex: 1; }
.project-right-panel.collapsed .panel-body { display: none; }

.panel-section { padding: 16px; border-bottom: 1px solid var(--border-default); }
.panel-section:last-child { border-bottom: none; }

.panel-section-title {
  font-size: 10px; font-weight: 700; text-transform: uppercase;
  letter-spacing: 0.1em; color: var(--text-tertiary); margin-bottom: 14px;
  display: flex; align-items: center; gap: 6px;
}

/* KPI ring inside right panel */
.panel-kpi-wrap {
  display: flex; flex-direction: column; align-items: center; gap: 14px;
}
.panel-kpi-wrap .kpi-ring-container { width: 80px; height: 80px; }
.panel-kpi-wrap .kpi-ring-inner { width: 64px; height: 64px; }
.panel-kpi-wrap .kpi-value { font-size: 18px; }
.panel-kpi-wrap .kpi-label { font-size: 9px; }

.panel-milestones { display: flex; flex-direction: column; gap: 8px; width: 100%; }

.panel-milestone-item {
  display: flex; align-items: center; gap: 8px;
  font-size: 11px; color: var(--text-secondary);
}
.panel-milestone-item .milestone-checkbox { width: 16px; height: 16px; border-radius: 4px; font-size: 9px; flex-shrink: 0; }
.panel-milestone-item .m-name { flex: 1; line-height: 1.3; }
.panel-milestone-item .m-pct { font-weight: 700; font-size: 11px; flex-shrink: 0; }
.panel-milestone-item.done .m-pct { color: var(--status-active); }
.panel-milestone-item:not(.done) .m-pct { color: var(--accent-primary); }

/* Not started construction state */
.construction-not-started {
  display: flex; flex-direction: column; align-items: center;
  gap: 8px; padding: 16px 0; color: var(--text-tertiary); text-align: center;
}
.construction-not-started .ns-icon { font-size: 28px; opacity: 0.4; }
.construction-not-started p { font-size: 12px; font-weight: 500; }

/* Operation in panel */
.panel-op-placeholder { display: flex; flex-direction: column; align-items: center; gap: 8px; padding: 12px 0; color: var(--text-tertiary); text-align: center; }
.panel-op-placeholder .op-icon { font-size: 24px; opacity: 0.4; }
.panel-op-placeholder p { font-size: 12px; font-weight: 500; }

.panel-op-status {
  display: inline-flex; align-items: center; gap: 6px;
  padding: 6px 12px; background: rgba(16,185,129,0.1);
  color: var(--status-active); border-radius: 6px; font-size: 12px; font-weight: 600;
}

/* ============================================ Detail Panel */
.detail-panel { background: var(--bg-primary); overflow-y: auto; height: calc(100vh - 120px); }

.detail-header { background: var(--bg-elevated); padding: 24px; border-bottom: 1px solid var(--border-default); }

.detail-header h2 { font-size: 18px; font-weight: 600; color: var(--text-primary); margin-bottom: 12px; line-height: 1.3; }

.detail-meta { display: flex; gap: 16px; flex-wrap: wrap; font-size: 12px; color: var(--text-secondary); font-family: 'JetBrains Mono', monospace; }
.detail-meta-item { display: flex; align-items: center; gap: 6px; }

/* ============================================ Tabs */
.tabs { display: flex; gap: 2px; background: var(--bg-elevated); border-bottom: 1px solid var(--border-default); padding: 0 24px; }
.tab { padding: 12px 16px; font-size: 13px; font-weight: 500; color: var(--text-secondary); cursor: pointer; border-bottom: 2px solid transparent; margin-bottom: -1px; transition: all 0.15s; }
.tab:hover { color: var(--text-primary); }
.tab.active { color: var(--accent-primary); border-bottom-color: var(--accent-primary); }
.tab-content { display: none; padding: 24px; }
.tab-content.active { display: block; }

/* ============================================ Section / Email / Summary */
.section-title { font-size: 11px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.1em; color: var(--text-tertiary); margin-bottom: 16px; display: flex; align-items: center; gap: 8px; }
.section-divider { height: 1px; background: var(--border-default); margin: 32px 0; }

.email-list { display: flex; flex-direction: column; gap: 12px; }
.email-item { background: var(--surface-card); border: 1px solid var(--border-default); border-radius: 8px; padding: 16px; text-decoration: none; color: inherit; transition: all 0.2s; display: block; }
.email-item:hover { border-color: var(--accent-primary); box-shadow: var(--shadow-md); transform: translateY(-1px); }
.email-item-header { display: flex; justify-content: space-between; align-items: start; margin-bottom: 8px; gap: 12px; }
.email-item-title { font-size: 13px; font-weight: 600; color: var(--text-primary); display: flex; align-items: center; gap: 6px; }
.email-item-icon { font-size: 16px; }
.email-item-meta { display: grid; grid-template-columns: auto 1fr; gap: 8px 12px; font-size: 11px; color: var(--text-secondary); font-family: 'JetBrains Mono', monospace; }
.email-meta-label { color: var(--text-tertiary); font-weight: 500; }
.email-meta-value { color: var(--text-secondary); }

.summary-section { margin-bottom: 32px; }
.summary-section h3 { font-size: 14px; font-weight: 600; color: var(--text-primary); margin-bottom: 12px; }
.summary-section p, .summary-section pre { font-size: 13px; line-height: 1.6; color: var(--text-secondary); white-space: pre-wrap; font-family: inherit; }

/* ============================================ Tasks Table */
.tasks-table-wrapper { overflow-x: auto; border: 1px solid var(--border-default); border-radius: 8px; }
.tasks-table { width: 100%; border-collapse: collapse; font-size: 12px; }
.tasks-table thead { background: var(--surface-card); border-bottom: 1px solid var(--border-default); }
.tasks-table th { padding: 12px 16px; text-align: left; font-weight: 600; font-size: 11px; text-transform: uppercase; letter-spacing: 0.05em; color: var(--text-tertiary); }
.tasks-table td { padding: 12px 16px; border-bottom: 1px solid var(--border-default); color: var(--text-secondary); }
.tasks-table tr:last-child td { border-bottom: none; }
.tasks-table tr:hover { background: var(--surface-hover); }
.task-status { display: inline-flex; padding: 4px 8px; border-radius: 4px; font-size: 10px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.05em; }
.task-status.done { background: rgba(16,185,129,0.1); color: var(--status-active); }
.task-status.todo { background: rgba(245,158,11,0.1); color: var(--status-recent); }
.task-description { color: var(--text-primary); font-weight: 500; }
.task-responsible { color: var(--accent-primary); font-weight: 500; }

/* ============================================ Master Task View */
#masterTaskView {
  display: none; padding: 24px;
  background: var(--bg-primary); flex: 1;
  overflow-y: auto; height: calc(100vh - 120px);
}
#masterTaskView.active { display: block; grid-column: 1 / -1; }

.master-task-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 24px; }
.master-task-header h2 { font-size: 20px; color: var(--text-primary); }

/* Project color tags */
.tag-color-0 { background: #e0e7ff; color: #3730a3; border-color: #c7d2fe; }
.tag-color-1 { background: #dcfce7; color: #166534; border-color: #bbf7d0; }
.tag-color-2 { background: #ffedd5; color: #9a3412; border-color: #fed7aa; }
.tag-color-3 { background: #fae8ff; color: #86198f; border-color: #f5d0fe; }
.tag-color-4 { background: #cffafe; color: #155e75; border-color: #a5f3fc; }
.tag-color-5 { background: #fce7f3; color: #9d174d; border-color: #fbcfe8; }
.tag-color-6 { background: #fef9c3; color: #854d0e; border-color: #fef08a; }

body.dark-mode .tag-color-0 { background: rgba(99,102,241,0.2); color: #a5b4fc; border-color: rgba(99,102,241,0.3); }
body.dark-mode .tag-color-1 { background: rgba(34,197,94,0.2); color: #86efac; border-color: rgba(34,197,94,0.3); }
body.dark-mode .tag-color-2 { background: rgba(249,115,22,0.2); color: #fdba74; border-color: rgba(249,115,22,0.3); }
body.dark-mode .tag-color-3 { background: rgba(217,70,239,0.2); color: #f0abfc; border-color: rgba(217,70,239,0.3); }
body.dark-mode .tag-color-4 { background: rgba(6,182,212,0.2); color: #67e8f9; border-color: rgba(6,182,212,0.3); }
body.dark-mode .tag-color-5 { background: rgba(236,72,153,0.2); color: #f9a8d4; border-color: rgba(236,72,153,0.3); }
body.dark-mode .tag-color-6 { background: rgba(234,179,8,0.2); color: #fde047; border-color: rgba(234,179,8,0.3); }

/* Master tasks table */
.master-tasks-table-wrapper { overflow-x: auto; border: 1px solid var(--border-default); border-radius: 8px; background: var(--surface-card); }
.master-tasks-table { width: 100%; border-collapse: collapse; font-size: 13px; }
.master-tasks-table thead { position: sticky; top: 0; z-index: 10; background: var(--surface-card); }
.master-tasks-table th { padding: 12px 16px; text-align: left; font-weight: 600; font-size: 11px; text-transform: uppercase; letter-spacing: 0.05em; color: var(--text-tertiary); border-bottom: 2px solid var(--border-default); white-space: nowrap; }
.master-tasks-table td { padding: 12px 16px; border-bottom: 1px solid var(--border-default); color: var(--text-secondary); vertical-align: top; }
.master-tasks-table tr:hover { background: var(--surface-hover); }

.project-badge { display: inline-block; padding: 4px 10px; background: rgba(37,99,235,0.1); color: var(--accent-primary); border-radius: 4px; font-size: 11px; font-weight: 600; font-family: 'JetBrains Mono', monospace; }
.phase-badge { display: inline-block; padding: 4px 10px; background: rgba(16,185,129,0.1); color: var(--status-active); border-radius: 4px; font-size: 11px; font-weight: 600; }
.master-task-description { max-width: 400px; line-height: 1.5; color: var(--text-primary); }
.master-task-owner { font-weight: 600; color: var(--accent-primary); }
.master-task-deadline { font-family: 'JetBrains Mono', monospace; font-size: 12px; }

/* ============================================ Attachments */
.attachments-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(160px, 1fr)); gap: 12px; }
.attachment-card { background: var(--surface-card); border: 1px solid var(--border-default); border-radius: 8px; padding: 16px; text-align: center; text-decoration: none; color: inherit; transition: all 0.2s; display: block; }
.attachment-card:hover { border-color: var(--accent-primary); box-shadow: var(--shadow-md); transform: translateY(-1px); }
.attachment-icon { font-size: 32px; margin-bottom: 8px; }
.attachment-name { font-size: 11px; font-weight: 600; color: var(--text-primary); margin-bottom: 4px; word-break: break-word; }
.attachment-type { font-size: 10px; color: var(--text-tertiary); text-transform: uppercase; letter-spacing: 0.05em; }

/* ============================================ Utilities */
.loading { text-align: center; padding: 60px 20px; color: var(--text-tertiary); font-size: 13px; }
.empty-state { text-align: center; padding: 60px 20px; color: var(--text-tertiary); font-size: 13px; }
.error-msg { text-align: center; padding: 40px 20px; color: #dc2626; font-size: 13px; }

@media (max-width: 1023px) {
  .main-content { grid-template-columns: 1fr !important; }
  .sidebar { height: 300px; }
  .detail-panel { height: auto; }
  .project-right-panel { display: none !important; }
}
  `;
}
