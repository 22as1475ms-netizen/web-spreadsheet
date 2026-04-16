import { useEffect, useState } from 'react';

const columnTypeOptions = [
  { value: 'text', label: 'Text' },
  { value: 'number', label: 'Number' },
  { value: 'date', label: 'Date' },
  { value: 'datetime-local', label: 'Date & Time' },
  { value: 'email', label: 'Email' },
  { value: 'tel', label: 'Phone' },
  { value: 'url', label: 'URL' }
];

const rowKindOptions = [
  { value: 'row', label: 'Standard Row' },
  { value: 'heading', label: 'Heading' },
  { value: 'subheading', label: 'Subheading' }
];

const rowAlignmentOptions = [
  { value: 'left', label: 'Left' },
  { value: 'center', label: 'Center' },
  { value: 'right', label: 'Right' }
];

function createField(key = '', value = '', type = 'text') {
  return {
    id: crypto.randomUUID(),
    key,
    value,
    type
  };
}

function createInitialFields(record, columnTypes, defaultColumns) {
  if (record) {
    const pairs = Object.entries(record)
      .filter(([key]) => key !== 'id')
      .map(([key, value]) =>
        createField(key, value == null ? '' : String(value), columnTypes[key] || 'text')
      );

    return pairs.length > 0 ? pairs : [createField()];
  }

  if (defaultColumns.length > 0) {
    return defaultColumns.map((column) => createField(column, '', columnTypes[column] || 'text'));
  }

  return [createField()];
}

export default function RecordForm({ columnTypes, defaultColumns, record, rowMeta, onCancel, onSave }) {
  const [fields, setFields] = useState(createInitialFields(record, columnTypes, defaultColumns));
  const [openFieldIds, setOpenFieldIds] = useState([]);
  const [rowKind, setRowKind] = useState('row');
  const [rowColor, setRowColor] = useState('#ffffff');
  const [rowAlignment, setRowAlignment] = useState('left');
  const [message, setMessage] = useState('');

  useEffect(() => {
    const initialFields = createInitialFields(record, columnTypes, defaultColumns);
    setFields(initialFields);
    setOpenFieldIds(initialFields.length > 0 ? [initialFields[0].id] : []);
    setRowKind(rowMeta?.kind || 'row');
    setRowColor(rowMeta?.color || '#ffffff');
    setRowAlignment(rowMeta?.alignment || 'left');
    setMessage('');
  }, [record, rowMeta, columnTypes, defaultColumns]);

  function updateField(id, property, value) {
    setFields((current) =>
      current.map((field) => (field.id === id ? { ...field, [property]: value } : field))
    );
  }

  function addField() {
    const nextField = createField();
    setFields((current) => [...current, nextField]);
    setOpenFieldIds([nextField.id]);
  }

  function removeField(id) {
    setFields((current) => {
      if (current.length === 1) {
        const nextField = createField();
        setOpenFieldIds([nextField.id]);
        return [nextField];
      }

      setOpenFieldIds((currentOpenFieldIds) => currentOpenFieldIds.filter((fieldId) => fieldId !== id));
      return current.filter((field) => field.id !== id);
    });
  }

  function clearForm() {
    const initialFields = createInitialFields(null, columnTypes, defaultColumns);
    setFields(initialFields);
    setOpenFieldIds(initialFields.length > 0 ? [initialFields[0].id] : []);
    setRowKind('row');
    setRowColor('#ffffff');
    setRowAlignment('left');
    setMessage('');
    onCancel?.();
  }

  function toggleFieldCard(id) {
    setOpenFieldIds((current) =>
      current.includes(id) ? current.filter((fieldId) => fieldId !== id) : [id]
    );
  }

  async function handleSubmit(event) {
    event.preventDefault();

    const nextRecord = {};
    const nextColumnTypes = {};

    for (const field of fields) {
      const key = field.key.trim();
      const value = field.value.trim();

      if (!key && !value) {
        continue;
      }

      if (!key) {
        setMessage('Each value needs a column name.');
        return;
      }

      if (Object.prototype.hasOwnProperty.call(nextRecord, key)) {
        setMessage(`Duplicate column name: ${key}`);
        return;
      }

      nextRecord[key] = value;
      nextColumnTypes[key] = field.type || 'text';
    }

    if (Object.keys(nextRecord).length === 0) {
      setMessage('Add at least one column before saving.');
      return;
    }

    setMessage('');
    await onSave({
      values: nextRecord,
      columnTypes: nextColumnTypes,
      rowMeta: {
        kind: rowKind,
        color: rowColor,
        alignment: rowAlignment
      }
    });

    if (!record) {
      const initialFields = createInitialFields(null, columnTypes, defaultColumns);
      setFields(initialFields);
      setOpenFieldIds(initialFields.length > 0 ? [initialFields[0].id] : []);
    }
  }

  return (
    <section className="panel editor-panel">
      <h3>{record ? 'Edit Record' : 'New Record'}</h3>
      <form className="stack panel-body" onSubmit={handleSubmit}>
        <p className="editor-note">
          Reuse the current spreadsheet columns, choose the row type, and set a highlight color if you
          want this row to stand out in the sheet.
        </p>

        {message ? <p className="message error">{message}</p> : null}

        <div className="row-style-grid">
          <label className="field">
            <span>Row Type</span>
            <select value={rowKind} onChange={(event) => setRowKind(event.target.value)}>
              {rowKindOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </label>
          <label className="field">
            <span>Highlight Color</span>
            <input type="color" value={rowColor} onChange={(event) => setRowColor(event.target.value)} />
          </label>
          <label className="field">
            <span>Text Align</span>
            <select value={rowAlignment} onChange={(event) => setRowAlignment(event.target.value)}>
              {rowAlignmentOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </label>
        </div>

        <div className="record-builder">
          {fields.map((field, index) => (
            <div className="record-field-card" key={field.id}>
              <div className="record-field-card__header">
                <button
                  className="record-field-card__toggle"
                  type="button"
                  onClick={() => toggleFieldCard(field.id)}
                >
                  <div className="record-field-card__title">
                    <strong>{field.key.trim() || `Field ${index + 1}`}</strong>
                    <small>{field.type || 'text'}</small>
                  </div>
                  <span>{openFieldIds.includes(field.id) ? 'Hide' : 'Show'}</span>
                </button>
                <button
                  className="mini-btn danger record-builder__remove"
                  type="button"
                  onClick={() => removeField(field.id)}
                >
                  Remove
                </button>
              </div>

              {openFieldIds.includes(field.id) ? (
                <div className="record-builder__row">
                  <label className="field">
                    <span>Column Name</span>
                    <input
                      value={field.key}
                      onChange={(event) => updateField(field.id, 'key', event.target.value)}
                      placeholder={index === 0 ? 'Example: Customer Name' : 'Enter column name'}
                    />
                  </label>
                  <label className="field">
                    <span>Type</span>
                    <select
                      value={field.type}
                      onChange={(event) => updateField(field.id, 'type', event.target.value)}
                    >
                      {columnTypeOptions.map((option) => (
                        <option key={option.value} value={option.value}>
                          {option.label}
                        </option>
                      ))}
                    </select>
                  </label>
                  <label className="field">
                    <span>Value</span>
                    <input
                      type={field.type}
                      value={field.value}
                      onChange={(event) => updateField(field.id, 'value', event.target.value)}
                      placeholder="Enter value"
                    />
                  </label>
                </div>
              ) : null}
            </div>
          ))}
        </div>

        <div className="actions record-form__actions">
          <button className="btn secondary record-form__action" type="button" onClick={addField}>
            Add Column
          </button>
          <button className="btn primary record-form__action" type="submit">
            {record ? 'Save Changes' : 'Add Row'}
          </button>
          <button className="btn secondary record-form__action" type="button" onClick={clearForm}>
            Clear
          </button>
          {record ? (
            <button className="btn secondary record-form__action" type="button" onClick={onCancel}>
              Cancel
            </button>
          ) : null}
        </div>
      </form>
    </section>
  );
}
