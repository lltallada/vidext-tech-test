import { Row as RowType } from './DrawListingItem';
import DrawsListingItem from './DrawListingItem';
import TldrawThumbnail from '../TldrawThumbnail';

export default function DrawsListing({
  initialRows,
}: {
  initialRows: RowType[];
}) {
  return (
    <div style={{ padding: 24 }}>
      <h1 style={{ marginBottom: 16 }}>Dissenys en memòria</h1>

      {initialRows.length === 0 ? (
        <p>No hi ha dissenys guardats.</p>
      ) : (
        <>
          <div
            style={{
              display: 'flex',
              gap: 12,
              padding: '0 12px',
              marginBottom: 8,
              fontWeight: 'bold',
              alignItems: 'center',
            }}
          >
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 12,
                minWidth: 220,
              }}
            >
              ID
            </div>
            <div style={{ flex: 1 }}>Darrera actualització</div>
            <div style={{ width: 140, textAlign: 'right' }}>Mida (bytes)</div>
            <div style={{ width: 140 }}></div>
          </div>

          <ul
            style={{
              listStyle: 'none',
              padding: 0,
              margin: 0,
              borderTop: '1px solid #eee',
            }}
          >
            {initialRows.map(r => (
              <DrawsListingItem key={r.id} row={r}>
                <div className="relative w-64 h-64">
                  <TldrawThumbnail id={r.id} />
                </div>
              </DrawsListingItem>
            ))}
          </ul>
        </>
      )}
    </div>
  );
}
