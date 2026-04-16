import { useEffect, useState } from 'react';

import Dashboard from './pages/Dashboard';
import FileLauncher from './pages/FileLauncher';
import Login from './pages/Login';

const storageKey = 'web-spreadsheet-auth';
const recentFilesKey = 'web-spreadsheet-recent-files';

function readStoredSession() {
  try {
    const raw = localStorage.getItem(storageKey);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

function getRecentFilesStorageKey(session) {
  const accountId = session?.user?.id || session?.user?.email;
  return accountId ? `${recentFilesKey}:${accountId}` : null;
}

function readRecentFiles(session) {
  const key = getRecentFilesStorageKey(session);

  if (!key) {
    return [];
  }

  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function createNewFile() {
  const createdAt = new Date().toISOString();
  const sheet = {
    id: `sheet-${Date.now()}`,
    name: 'Sheet 1',
    records: [],
    hiddenRows: [],
    hiddenColumns: [],
    columnTypes: {},
    rowMeta: {}
  };

  return {
    id: `file-${Date.now()}`,
    name: `Untitled Spreadsheet ${new Date().toLocaleDateString()}`,
    sheets: [sheet],
    records: sheet.records,
    hiddenRows: sheet.hiddenRows,
    hiddenColumns: sheet.hiddenColumns,
    columnTypes: sheet.columnTypes,
    rowMeta: sheet.rowMeta,
    createdAt,
    updatedAt: createdAt,
    sourceLabel: 'New file'
  };
}

function isWorkbookEmpty(file) {
  const sheets = Array.isArray(file?.sheets) ? file.sheets : [];

  if (sheets.length === 0) {
    return true;
  }

  return sheets.every((sheet) => {
    const hasRows = Array.isArray(sheet.records) && sheet.records.length > 0;
    const hasColumns = sheet.columnTypes && Object.keys(sheet.columnTypes).length > 0;
    return !hasRows && !hasColumns;
  });
}

export default function App() {
  // Always start from the auth screen instead of restoring the last session on load.
  const [session, setSession] = useState(null);
  const [activeFile, setActiveFile] = useState(null);
  const [recentFiles, setRecentFiles] = useState([]);
  const recentFilesStorageKey = getRecentFilesStorageKey(session);

  useEffect(() => {
    if (session) {
      localStorage.setItem(storageKey, JSON.stringify(session));
      return;
    }

    localStorage.removeItem(storageKey);
  }, [session]);

  useEffect(() => {
    setActiveFile(null);
    setRecentFiles(readRecentFiles(session));
  }, [recentFilesStorageKey, session]);

  useEffect(() => {
    if (!recentFilesStorageKey) {
      return;
    }

    localStorage.setItem(recentFilesStorageKey, JSON.stringify(recentFiles));
  }, [recentFiles, recentFilesStorageKey]);

  function openFile(file) {
    setActiveFile(file);
  }

  function saveRecentFile(file) {
    setActiveFile((current) => (current?.id === file.id ? current : file));

    if (isWorkbookEmpty(file)) {
      setRecentFiles((current) => current.filter((entry) => entry.id !== file.id));
      return;
    }

    setRecentFiles((current) => {
      const next = [file, ...current.filter((entry) => entry.id !== file.id)];
      return next.slice(0, 8);
    });
  }

  function deleteRecentFile(fileId) {
    setRecentFiles((current) => current.filter((entry) => entry.id !== fileId));

    if (activeFile?.id === fileId) {
      setActiveFile(null);
    }
  }

  function handleLogout() {
    setActiveFile(null);
    setSession(null);
    localStorage.removeItem('token');
  }

  return (
    <div className={`shell ${session ? '' : 'shell--auth'}`.trim()}>
      {session ? (
        activeFile ? (
          <Dashboard
            activeFile={activeFile}
            onBackToFiles={() => setActiveFile(null)}
            onLogout={handleLogout}
            onSaveFile={saveRecentFile}
            session={session}
          />
        ) : (
          <FileLauncher
            session={session}
            recentFiles={recentFiles}
            onCreateNew={() => openFile(createNewFile())}
            onDeleteRecent={deleteRecentFile}
            onImportFile={saveRecentFile}
            onLogout={handleLogout}
            onOpenRecent={saveRecentFile}
          />
        )
      ) : (
        <div className="grid auth">
          <Login onSuccess={setSession} />
        </div>
      )}
    </div>
  );
}
