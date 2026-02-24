// ============================================
// FILE: Firestore_Connection.gs
// Connects Apps Script to Firestore via REST API
// ============================================

const FIREBASE_PROJECT_ID = 'projecthub-6b198';
const FIRESTORE_BASE_URL   = `https://firestore.googleapis.com/v1/projects/${FIREBASE_PROJECT_ID}/databases/(default)/documents`;

// ── Low-level REST helpers ──────────────────────────────────────────────────

function firestoreRequest_(method, path, payload) {
  const url     = FIRESTORE_BASE_URL + path;
  const token   = ScriptApp.getOAuthToken();
  const options = {
    method,
    headers: {
      Authorization: 'Bearer ' + token,
      'Content-Type': 'application/json'
    },
    muteHttpExceptions: true
  };
  if (payload) options.payload = JSON.stringify(payload);
  const response = UrlFetchApp.fetch(url, options);
  const code     = response.getResponseCode();
  const body     = response.getContentText();
  if (code >= 400) throw new Error(`Firestore error ${code}: ${body}`);
  return body ? JSON.parse(body) : null;
}

/** Convert a plain JS object → Firestore document fields format */
function toFirestoreFields_(obj) {
  const fields = {};
  Object.entries(obj).forEach(([key, val]) => {
    if (val === null || val === undefined || val === '') {
      fields[key] = { nullValue: null };
    } else if (typeof val === 'boolean') {
      fields[key] = { booleanValue: val };
    } else if (typeof val === 'number') {
      fields[key] = { doubleValue: val };
    } else {
      fields[key] = { stringValue: String(val) };
    }
  });
  return fields;
}

/** Convert Firestore document → plain JS object */
function fromFirestoreFields_(fields) {
  const obj = {};
  Object.entries(fields || {}).forEach(([key, valObj]) => {
    if      ('stringValue'  in valObj) obj[key] = valObj.stringValue;
    else if ('integerValue' in valObj) obj[key] = Number(valObj.integerValue);
    else if ('doubleValue'  in valObj) obj[key] = valObj.doubleValue;
    else if ('booleanValue' in valObj) obj[key] = valObj.booleanValue;
    else if ('nullValue'    in valObj) obj[key] = null;
    else                               obj[key] = null;
  });
  return obj;
}

// ── Public CRUD operations ──────────────────────────────────────────────────

/** Add a document to a collection (auto-generated ID) */
function firestoreAdd(collection, data) {
  const payload = { fields: toFirestoreFields_(data) };
  return firestoreRequest_('POST', `/${collection}`, payload);
}

/** Set a document with a specific ID */
function firestoreSet(collection, docId, data) {
  const payload = { fields: toFirestoreFields_(data) };
  return firestoreRequest_('PATCH', `/${collection}/${docId}`, payload);
}

/** Get a single document by ID */
function firestoreGet(collection, docId) {
  const result = firestoreRequest_('GET', `/${collection}/${docId}`);
  return result ? fromFirestoreFields_(result.fields) : null;
}

/** List all documents in a collection (up to 300) */
function firestoreList(collection) {
  const result = firestoreRequest_('GET', `/${collection}?pageSize=300`);
  if (!result || !result.documents) return [];
  return result.documents.map(doc => ({
    id: doc.name.split('/').pop(),
    ...fromFirestoreFields_(doc.fields)
  }));
}

/** Delete a document */
function firestoreDelete(collection, docId) {
  return firestoreRequest_('DELETE', `/${collection}/${docId}`);
}

// ── Mail Register specific functions ───────────────────────────────────────

/** Add one email record to mail_register collection */
function addMailRecord(record) {
  const data = {
    mail_id:      record.mail_id      || '',
    project:      record.project      || '',
    phase:        record.phase        || '',
    category:     record.category     || '',
    date:         record.date         || '',
    sender:       record.sender       || '',
    recipient:    record.recipient    || '',
    cc:           record.cc           || '',
    subject:      record.subject      || '',
    summary:      record.summary      || '',
    action_items: record.action_items || '',
    status:       record.status       || 'pending',
    gmail_link:   record.gmail_link   || ''
  };
  return firestoreSet('mail_register', data.mail_id || Utilities.getUuid(), data);
}

/** Get all mail register records */
function getMailRegister() {
  return firestoreList('mail_register');
}
