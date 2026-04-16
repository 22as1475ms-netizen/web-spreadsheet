import { useRef, useState } from 'react';

import AppShellHeader from '../components/AppShellHeader';
import { createImportFileFromWorkbook } from '../utils/workbook';

export default function FileLauncher({
  recentFiles,
  session,
  onCreateNew,
  onDeleteRecent,
  onOpenRecent,
  onImportFile,
  onLogout
}) {
  const [message, setMessage] = useState('');
  const [confirmDialog, setConfirmDialog] = useState(null);
  const fileInputRef = useRef(null);

  async function handleFileChange(event) {
    const [selectedFile] = event.target.files || [];

    if (!selectedFile) {
      return;
    }

    try {
      onImportFile(await createImportFileFromWorkbook(selectedFile));
      setMessage('');
    } catch (error) {
      setMessage(error.message || 'Unable to open file.');
    } finally {
      event.target.value = '';
    }
  }

  return (
    <div className="launcher-shell">
      <AppShellHeader
        session={session}
        contextLabel="Workspace Home"
        contextValue="Open, import, and manage workbook files"
        contextMeta="Everything starts here before you enter a sheet."
        actions={[
          {
            label: 'Log Out',
            variant: 'danger',
            onClick: () =>
              setConfirmDialog({
                title: 'Log out of this workspace?',
                description: 'You will return to the sign-in screen for this device.',
                confirmLabel: 'Log Out',
                tone: 'danger',
                onConfirm: () => {
                  setConfirmDialog(null);
                  onLogout();
                }
              })
          }
        ]}
      />

      <section className="launcher">
        <div className="launcher__hero">
          <div className="launcher__eyebrow">
            <div className="login-card__badge">Workbook Dashboard</div>
            <div className="launcher__status">Your files, sheets, and account tools in one place</div>
          </div>
          <h2>Choose how you want to continue</h2>
          <p>Start a new workbook, reopen a saved one, or import an Excel or JSON workbook from your device.</p>
        </div>

        {message ? <p className="message error">{message}</p> : null}

        <div className="launcher__actions">
          <button className="launcher-card launcher-card--primary" type="button" onClick={onCreateNew}>
            <div className="launcher-card__icon">+</div>
            <strong>Create New Workbook</strong>
            <span>Open a fresh spreadsheet canvas with one ready-to-edit sheet and clean table space.</span>
            <div className="launcher-card__foot">Start building instantly</div>
          </button>

          <button className="launcher-card" type="button" onClick={() => fileInputRef.current?.click()}>
            <div className="launcher-card__icon">^</div>
            <strong>Import Workbook</strong>
            <span>Open an `.xlsx`, `.xls`, or `.json` workbook and convert it into this spreadsheet workspace.</span>
            <div className="launcher-card__foot">Open from this device</div>
          </button>
        </div>

        <div className="launcher-card launcher-card--recent">
          <div className="launcher-card__header">
            <div>
              <strong>Recent Workbooks</strong>
              <span>Return to the files you previously opened or edited on this device.</span>
            </div>
          </div>
          <div className="recent-files">
            {recentFiles.length === 0 ? (
              <p className="empty">No recent files yet. Create or import a workbook to see it here later.</p>
            ) : (
              recentFiles.map((file) => (
                <div className="recent-file" key={file.id}>
                  <button
                    className="recent-file__open"
                    type="button"
                    onClick={() => onOpenRecent(file)}
                  >
                    <span>{file.name}</span>
                    <small>{new Date(file.updatedAt || file.createdAt).toLocaleString()}</small>
                  </button>
                  <button
                    className="recent-file__delete"
                    type="button"
                    onClick={() => onDeleteRecent(file.id)}
                  >
                    Remove
                  </button>
                </div>
              ))
            )}
          </div>
        </div>

        <input
          ref={fileInputRef}
          className="sr-only"
          type="file"
          accept=".json,application/json,.xlsx,.xls,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet,application/vnd.ms-excel"
          onChange={handleFileChange}
        />
      </section>

      {confirmDialog ? (
        <div className="confirm-overlay" role="presentation" onClick={() => setConfirmDialog(null)}>
          <div
            className={`confirm-dialog ${confirmDialog.tone === 'danger' ? 'confirm-dialog--danger' : ''}`}
            role="dialog"
            aria-modal="true"
            aria-labelledby="launcher-confirm-title"
            onClick={(event) => event.stopPropagation()}
          >
            <h3 id="launcher-confirm-title">{confirmDialog.title}</h3>
            <p>{confirmDialog.description}</p>
            <div className="confirm-dialog__actions">
              <button className="btn secondary" type="button" onClick={() => setConfirmDialog(null)}>
                Cancel
              </button>
              <button className="btn danger" type="button" onClick={confirmDialog.onConfirm}>
                {confirmDialog.confirmLabel || 'Confirm'}
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
