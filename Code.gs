// Backend Google Apps Script for Sintamas Masjid Fatkhurrohmah using Google Sheets tabs.

const EMBEDDED_GAS_WEB_APP_URL = 'https://script.google.com/macros/s/AKfycbx6MDS1Zi0WnweE5Aq4ZxXeqwrH1XoCbGxEACDLJ8CyIuyiX-9WSHOYiOF-DzoqZjQ5/exec';

const SHEET_HEADERS = {
  items: ['id', 'kode', 'nama', 'jenis', 'kondisi', 'sumber', 'lokasi', 'keterangan', 'foto'],
  loans: ['id', 'nomor', 'barang', 'namaPeminjam', 'kontak', 'tglPinjam', 'tglKembali', 'keperluan', 'status'],
  maintenance: ['id', 'kode', 'namaBarang', 'tanggal', 'vendor', 'biaya', 'status'],
  users: ['id', 'nama', 'username', 'password', 'role'],
  settings: ['key', 'value']
};

const DATE_FIELDS = new Set(['tglPinjam', 'tglKembali', 'tanggal']);

const DEFAULT_SETTINGS_MAP = {
  mosqueName: 'Masjid Fatkhurrohmah',
  mosqueId: '01.6.14.10.06.000168',
  mosqueAddress: 'Jambon, RT.21 RW.23 Desa Sabranglor, Kec. Trucuk Kab. Klaten, 57467',
  mosqueLogo: '',
  gasWebAppUrl: EMBEDDED_GAS_WEB_APP_URL
};

const DEFAULT_USERS_SEED = [
  { id: 'USR-001', nama: 'Admin Utama Masjid', username: 'admin', password: '123', role: 'Admin Utama' },
  { id: 'USR-002', nama: 'Petugas Inventaris', username: 'petugas', password: '123', role: 'Petugas / Admin' },
  { id: 'USR-003', nama: 'Pemeriksa Aset', username: 'inspector', password: '123', role: 'Inspector' }
];

function getTargetSpreadsheet() {
  const props = PropertiesService.getScriptProperties();
  const configuredId = props.getProperty('SINTAMAS_SPREADSHEET_ID');
  if (configuredId) {
    return SpreadsheetApp.openById(configuredId);
  }
  const active = SpreadsheetApp.getActiveSpreadsheet();
  if (active) {
    return active;
  }
  throw new Error('Spreadsheet belum terhubung. Buka proyek GAS dari menu Extensions -> Apps Script di Google Sheets.');
}

function ensureSheetWithHeaders(ss, sheetName, headers) {
  let sheet = ss.getSheetByName(sheetName);
  if (!sheet) {
    sheet = ss.insertSheet(sheetName);
  }
  const currentHeaders = sheet.getRange(1, 1, 1, headers.length).getValues()[0];
  const needsHeader = headers.some((h, idx) => currentHeaders[idx] !== h);
  if (needsHeader) {
    sheet.getRange(1, 1, 1, headers.length).setValues([headers]);
    sheet.setFrozenRows(1);
  }
  return sheet;
}

function initializeDatabase() {
  const ss = getTargetSpreadsheet();
  Object.entries(SHEET_HEADERS).forEach(([tabName, headers]) => {
    ensureSheetWithHeaders(ss, tabName, headers);
  });

  const usersSheet = ss.getSheetByName('users');
  if (usersSheet.getLastRow() <= 1) {
    const rows = DEFAULT_USERS_SEED.map(u => [u.id, u.nama, u.username, "'" + String(u.password), u.role]);
    usersSheet.getRange(2, 1, rows.length, 5).setValues(rows);
  }

  const settingsSheet = ss.getSheetByName('settings');
  if (settingsSheet.getLastRow() <= 1) {
    const merged = { ...DEFAULT_SETTINGS_MAP, gasWebAppUrl: getResolvedGasUrl() };
    const rows = Object.entries(merged).map(([k, v]) => [k, String(v || '')]);
    settingsSheet.getRange(2, 1, rows.length, 2).setValues(rows);
  }

  return ss;
}

function getResolvedGasUrl() {
  try {
    const serviceUrl = ScriptApp.getService().getUrl();
    if (serviceUrl && serviceUrl.indexOf('/exec') !== -1) {
      return serviceUrl;
    }
  } catch (_) {}
  return EMBEDDED_GAS_WEB_APP_URL;
}

function normalizeCellForRead(headerName, val) {
  if (val === null || val === undefined) return '';
  if (val instanceof Date || Object.prototype.toString.call(val) === '[object Date]') {
    const tz = Session.getScriptTimeZone() || 'Asia/Jakarta';
    return Utilities.formatDate(val, tz, 'yyyy-MM-dd');
  }
  if (DATE_FIELDS.has(headerName)) {
    const str = String(val).trim();
    if (/^\d{4}-\d{2}-\d{2}/.test(str)) {
      return str.slice(0, 10);
    }
  }
  return val;
}

function serializeCellForSheet(headerName, val) {
  if (val === null || val === undefined) return '';
  if (typeof val === 'object') return JSON.stringify(val);
  if (headerName === 'password') {
    return "'" + String(val);
  }
  if (DATE_FIELDS.has(headerName) && typeof val === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(val.trim())) {
    // Prefix apostrophe so Google Sheets stores ISO dates as text without UTC shift.
    return "'" + val.trim();
  }
  return val;
}

function readTableRecords(sheet, headers) {
  const lastRow = sheet.getLastRow();
  if (lastRow <= 1) return [];
  const values = sheet.getRange(2, 1, lastRow - 1, headers.length).getValues();
  const records = [];
  for (let i = 0; i < values.length; i++) {
    const row = values[i];
    const hasValue = row.some(cell => String(cell || '').trim() !== '');
    if (!hasValue) continue;
    const obj = {};
    headers.forEach((h, colIdx) => {
      obj[h] = normalizeCellForRead(h, row[colIdx]);
    });
    records.push(obj);
  }
  return records;
}

function writeTableRecords(sheet, headers, list) {
  const safeList = Array.isArray(list) ? list : [];
  const maxRow = sheet.getMaxRows();
  if (maxRow > 1) {
    sheet.getRange(2, 1, maxRow - 1, headers.length).clearContent();
  }
  if (safeList.length > 0) {
    const matrix = safeList.map(item => headers.map(h => {
      const raw = item && item[h] !== undefined && item[h] !== null ? item[h] : '';
      return serializeCellForSheet(h, raw);
    }));
    sheet.getRange(2, 1, matrix.length, headers.length).setValues(matrix);
  }
}

function findRowIndexById(sheet, targetId) {
  const lastRow = sheet.getLastRow();
  if (lastRow <= 1) return -1;
  const ids = sheet.getRange(2, 1, lastRow - 1, 1).getValues();
  const needle = String(targetId || '').trim();
  for (let i = 0; i < ids.length; i++) {
    if (String(ids[i][0] || '').trim() === needle) {
      return i + 2;
    }
  }
  return -1;
}

function upsertSingleRecord(sheet, headers, record, preservePasswordOnBlank) {
  if (!record || !record.id) {
    throw new Error('Record wajib memiliki ID.');
  }
  const rowIndex = findRowIndexById(sheet, record.id);
  let existingRow = null;
  if (rowIndex !== -1 && preservePasswordOnBlank) {
    existingRow = sheet.getRange(rowIndex, 1, 1, headers.length).getValues()[0];
  }

  const rowValues = headers.map((h, idx) => {
    const incoming = record[h];
    if (preservePasswordOnBlank && h === 'password' && (!incoming || String(incoming).trim() === '') && existingRow) {
      return serializeCellForSheet(h, existingRow[idx]);
    }
    return serializeCellForSheet(h, incoming !== undefined && incoming !== null ? incoming : '');
  });

  if (rowIndex !== -1) {
    sheet.getRange(rowIndex, 1, 1, headers.length).setValues([rowValues]);
  } else {
    const targetRow = Math.max(2, sheet.getLastRow() + 1);
    sheet.getRange(targetRow, 1, 1, headers.length).setValues([rowValues]);
  }
}

function deleteSingleRecord(sheet, targetId) {
  const rowIndex = findRowIndexById(sheet, targetId);
  if (rowIndex !== -1) {
    sheet.deleteRow(rowIndex);
  }
}

function readSettingsObject(sheet) {
  const result = { ...DEFAULT_SETTINGS_MAP, gasWebAppUrl: getResolvedGasUrl() };
  const lastRow = sheet.getLastRow();
  if (lastRow <= 1) return result;
  const rows = sheet.getRange(2, 1, lastRow - 1, 2).getValues();
  rows.forEach(r => {
    const key = String(r[0] || '').trim();
    if (!key) return;
    result[key] = r[1] === null || r[1] === undefined ? '' : String(r[1]);
  });
  if (!result.gasWebAppUrl) {
    result.gasWebAppUrl = EMBEDDED_GAS_WEB_APP_URL;
  }
  return result;
}

function writeSettingsObject(sheet, settingsObj) {
  const merged = {
    ...DEFAULT_SETTINGS_MAP,
    ...(settingsObj && typeof settingsObj === 'object' ? settingsObj : {}),
    gasWebAppUrl: getResolvedGasUrl()
  };
  const entries = Object.entries(merged).map(([k, v]) => [k, v === null || v === undefined ? '' : String(v)]);
  const maxRow = sheet.getMaxRows();
  if (maxRow > 1) {
    sheet.getRange(2, 1, maxRow - 1, 2).clearContent();
  }
  if (entries.length > 0) {
    sheet.getRange(2, 1, entries.length, 2).setValues(entries);
  }
}

function sanitizeUsersList(rawUsers) {
  const source = Array.isArray(rawUsers) && rawUsers.length > 0 ? rawUsers : DEFAULT_USERS_SEED;
  // Never expose plaintext passwords in public getAll responses.
  return source.map(u => ({
    id: String(u.id || ''),
    nama: String(u.nama || ''),
    username: String(u.username || ''),
    role: String(u.role || 'Inspector')
  }));
}

function getAllPayload() {
  const ss = initializeDatabase();
  const items = readTableRecords(ss.getSheetByName('items'), SHEET_HEADERS.items);
  const loans = readTableRecords(ss.getSheetByName('loans'), SHEET_HEADERS.loans);
  const maintenance = readTableRecords(ss.getSheetByName('maintenance'), SHEET_HEADERS.maintenance);
  const rawUsers = readTableRecords(ss.getSheetByName('users'), SHEET_HEADERS.users);
  const settings = readSettingsObject(ss.getSheetByName('settings'));

  return {
    items,
    loans,
    maintenance,
    users: sanitizeUsersList(rawUsers),
    settings,
    gasWebAppUrl: getResolvedGasUrl()
  };
}

function verifyUserLogin(username, password) {
  const ss = initializeDatabase();
  const rawUsers = readTableRecords(ss.getSheetByName('users'), SHEET_HEADERS.users);
  const source = rawUsers.length > 0 ? rawUsers : DEFAULT_USERS_SEED;
  const cleanUser = String(username || '').trim().toLowerCase();
  const cleanPass = String(password || '');

  const matched = source.find(
    u => String(u.username || '').trim().toLowerCase() === cleanUser && String(u.password || '') === cleanPass
  );
  if (!matched) {
    return null;
  }
  return {
    id: String(matched.id || ''),
    nama: String(matched.nama || ''),
    username: String(matched.username || ''),
    role: String(matched.role || 'Inspector')
  };
}

function applyMutation(entity, operation, record) {
  const ss = initializeDatabase();
  if (entity === 'settings') {
    writeSettingsObject(ss.getSheetByName('settings'), record);
    return;
  }

  const headers = SHEET_HEADERS[entity];
  if (!headers) {
    throw new Error('Entitas tidak dikenali: ' + entity);
  }

  const sheet = ss.getSheetByName(entity);
  if (operation === 'delete') {
    const targetId = record && record.id ? record.id : record;
    deleteSingleRecord(sheet, targetId);
    if (entity === 'users' && sheet.getLastRow() <= 1) {
      const seedRows = DEFAULT_USERS_SEED.map(u => [u.id, u.nama, u.username, "'" + String(u.password), u.role]);
      sheet.getRange(2, 1, seedRows.length, 5).setValues(seedRows);
    }
    return;
  }

  if (operation === 'create' || operation === 'update') {
    const preservePass = entity === 'users' && operation === 'update';
    upsertSingleRecord(sheet, headers, record, preservePass);
    return;
  }

  throw new Error('Operasi tidak valid: ' + operation);
}

function restoreFullPayload(payload) {
  const ss = initializeDatabase();
  const data = payload && typeof payload === 'object' ? payload : {};

  if (Array.isArray(data.items)) {
    writeTableRecords(ss.getSheetByName('items'), SHEET_HEADERS.items, data.items);
  }
  if (Array.isArray(data.loans)) {
    writeTableRecords(ss.getSheetByName('loans'), SHEET_HEADERS.loans, data.loans);
  }
  if (Array.isArray(data.maintenance)) {
    writeTableRecords(ss.getSheetByName('maintenance'), SHEET_HEADERS.maintenance, data.maintenance);
  }
  if (Array.isArray(data.users) && data.users.length > 0) {
    writeTableRecords(ss.getSheetByName('users'), SHEET_HEADERS.users, data.users);
  }
  if (data.settings && typeof data.settings === 'object') {
    writeSettingsObject(ss.getSheetByName('settings'), data.settings);
  }
}

function jsonResponse(obj) {
  return ContentService
    .createTextOutput(JSON.stringify(obj))
    .setMimeType(ContentService.MimeType.JSON);
}

function doGet(e) {
  try {
    const action = e && e.parameter && e.parameter.action ? String(e.parameter.action) : 'getAll';
    if (action === 'ping') {
      return jsonResponse({
        ok: true,
        app: 'Sintamas Masjid Fatkhurrohmah',
        gasWebAppUrl: getResolvedGasUrl(),
        timestamp: new Date().toISOString()
      });
    }
    const data = getAllPayload();
    return jsonResponse({
      ok: true,
      data: data
    });
  } catch (err) {
    return jsonResponse({
      ok: false,
      error: err && err.message ? err.message : String(err),
      gasWebAppUrl: getResolvedGasUrl()
    });
  }
}

function doPost(e) {
  const lock = LockService.getScriptLock();
  try {
    lock.waitLock(15000);
    const rawBody = e && e.postData && e.postData.contents ? e.postData.contents : '{}';
    const parsed = JSON.parse(rawBody);
    const action = parsed && parsed.action ? String(parsed.action) : 'mutate';

    if (action === 'login') {
      const user = verifyUserLogin(parsed.username, parsed.password);
      if (!user) {
        return jsonResponse({
          ok: false,
          code: 'INVALID_CREDENTIALS',
          error: 'Username atau password tidak sesuai. Silakan periksa kembali.'
        });
      }
      return jsonResponse({
        ok: true,
        user: user
      });
    }

    if (action === 'restoreAll' || parsed.operation === 'restore') {
      const payload = parsed && parsed.payload ? parsed.payload : parsed;
      restoreFullPayload(payload);
      return jsonResponse({
        ok: true,
        message: 'Seluruh data berhasil dipulihkan ke Google Sheets',
        data: getAllPayload()
      });
    }

    applyMutation(parsed.entity, parsed.operation, parsed.record);
    return jsonResponse({
      ok: true,
      message: 'Perubahan berhasil disimpan ke Google Sheets'
    });
  } catch (err) {
    return jsonResponse({
      ok: false,
      error: err && err.message ? err.message : String(err),
      gasWebAppUrl: getResolvedGasUrl()
    });
  } finally {
    if (lock.hasLock()) {
      lock.releaseLock();
    }
  }
}