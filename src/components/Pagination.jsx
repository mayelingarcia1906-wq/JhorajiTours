import { ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight } from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';

export const Pagination = ({ currentPage, totalPages, totalItems, itemsPerPage, onPageChange }) => {
  const { t } = useLanguage();

  if (totalItems === 0 || totalPages <= 1) return null;

  const startItem = ((currentPage - 1) * itemsPerPage) + 1;
  const endItem = Math.min(currentPage * itemsPerPage, totalItems);

  return (
    <div className="d-flex justify-content-between align-items-center mt-4">
      <span className="text-muted" style={{ fontSize: '0.9rem' }}>
        {t('showing', 'Mostrando')} {startItem} {t('to', 'a')} {endItem} {t('of', 'de')} {totalItems}
      </span>
      <div className="btn-group">
        <button 
          className="btn btn-outline" 
          disabled={currentPage === 1} 
          onClick={() => onPageChange(Math.max(currentPage - 1, 1))}
          style={{ fontSize: '0.85rem' }}
        >
          {t('previous', 'Anterior')}
        </button>
        <button 
          className="btn btn-outline" 
          disabled={currentPage === totalPages || totalPages === 0} 
          onClick={() => onPageChange(Math.min(currentPage + 1, totalPages))}
          style={{ fontSize: '0.85rem' }}
        >
          {t('next', 'Siguiente')}
        </button>
      </div>
    </div>
  );
};
