import { ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight } from 'lucide-react';

const Pagination = ({ currentPage, totalPages, totalItems, itemsPerPage, onPageChange }) => {
  if (totalPages <= 1) {
    return totalItems > 0 ? (
      <div className="pagination-container" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0.85rem 1rem', fontSize: '0.82rem', color: 'var(--text-light)' }}>
        <span>Mostrando <strong style={{ color: 'var(--text-dark)' }}>{totalItems}</strong> resultados</span>
      </div>
    ) : null;
  }

  const startItem = (currentPage - 1) * itemsPerPage + 1;
  const endItem = Math.min(currentPage * itemsPerPage, totalItems);

  const pageNumbers = [];
  const maxButtons = 5;
  let startPage = Math.max(1, currentPage - Math.floor(maxButtons / 2));
  let endPage = Math.min(totalPages, startPage + maxButtons - 1);
  if (endPage - startPage + 1 < maxButtons) {
    startPage = Math.max(1, endPage - maxButtons + 1);
  }
  for (let i = startPage; i <= endPage; i++) pageNumbers.push(i);

  const buttonStyle = (active) => ({
    minWidth: 34,
    height: 34,
    padding: '0 0.5rem',
    borderRadius: 'var(--radius-md)',
    border: '1.5px solid ' + (active ? 'var(--primary-color)' : 'var(--border-color)'),
    background: active ? 'var(--primary-color)' : 'transparent',
    color: active ? '#fff' : 'var(--text-dark)',
    fontWeight: active ? 600 : 500,
    fontSize: '0.82rem',
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    cursor: 'pointer',
    transition: 'var(--transition)',
    boxShadow: active ? '0 2px 6px -1px rgba(14, 165, 233, 0.35)' : 'none',
  });

  return (
    <div
      className="pagination-container"
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '0.85rem 1rem',
        flexWrap: 'wrap',
        gap: 12,
      }}
    >
      <span style={{ fontSize: '0.82rem', color: 'var(--text-light)' }}>
        Mostrando <strong style={{ color: 'var(--text-dark)' }}>{startItem}–{endItem}</strong> de <strong style={{ color: 'var(--text-dark)' }}>{totalItems}</strong>
      </span>

      <div style={{ display: 'flex', gap: 4, alignItems: 'center' }}>
        <button onClick={() => onPageChange(1)} disabled={currentPage === 1} style={{ ...buttonStyle(false), opacity: currentPage === 1 ? 0.4 : 1 }} aria-label="Primera">
          <ChevronsLeft size={15} />
        </button>
        <button onClick={() => onPageChange(currentPage - 1)} disabled={currentPage === 1} style={{ ...buttonStyle(false), opacity: currentPage === 1 ? 0.4 : 1 }} aria-label="Anterior">
          <ChevronLeft size={15} />
        </button>
        {pageNumbers[0] > 1 && <span style={{ color: 'var(--text-faint)', padding: '0 4px' }}>…</span>}
        {pageNumbers.map((p) => (
          <button key={p} onClick={() => onPageChange(p)} style={buttonStyle(p === currentPage)}>
            {p}
          </button>
        ))}
        {pageNumbers[pageNumbers.length - 1] < totalPages && <span style={{ color: 'var(--text-faint)', padding: '0 4px' }}>…</span>}
        <button onClick={() => onPageChange(currentPage + 1)} disabled={currentPage === totalPages} style={{ ...buttonStyle(false), opacity: currentPage === totalPages ? 0.4 : 1 }} aria-label="Siguiente">
          <ChevronRight size={15} />
        </button>
        <button onClick={() => onPageChange(totalPages)} disabled={currentPage === totalPages} style={{ ...buttonStyle(false), opacity: currentPage === totalPages ? 0.4 : 1 }} aria-label="Última">
          <ChevronsRight size={15} />
        </button>
      </div>
    </div>
  );
};

export { Pagination };
export default Pagination;
