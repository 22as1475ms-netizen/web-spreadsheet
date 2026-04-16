export default function BrandMark({ compact = false }) {
  return (
    <div className={`brand-mark ${compact ? 'brand-mark--compact' : ''}`}>
      <div className="brand-mark__glyph" aria-hidden="true">
        <span />
        <span />
        <span />
        <span />
      </div>
      <div className="brand-mark__copy">
        <strong>Web Spreadsheet</strong>
        {compact ? null : <small>Workbook System</small>}
      </div>
    </div>
  );
}
