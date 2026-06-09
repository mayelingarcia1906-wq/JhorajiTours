import React from 'react';
import { AlertTriangle, Trash2 } from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';

const DeleteConfirmModal = ({ isOpen, onConfirm, onCancel, title, message }) => {
  const { t } = useLanguage();

  if (!isOpen) return null;

  return (
    <div className="modal-overlay" style={{ zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(0, 0, 0, 0.5)' }}>
      <div className="card print-no" style={{ maxWidth: '420px', width: '90%', textAlign: 'center', padding: '24px', backgroundColor: 'var(--card-bg)', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-lg)' }}>
        <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '16px' }}>
          <div style={{ width: '48px', height: '48px', borderRadius: '50%', backgroundColor: 'rgba(239, 68, 68, 0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--danger)' }}>
            <AlertTriangle size={24} />
          </div>
        </div>
        <h3 style={{ marginBottom: '10px', fontSize: '1.25rem', fontWeight: 600, color: 'var(--text-dark)' }}>
          {title || t('deleteTitle') || 'Confirmar Eliminación'}
        </h3>
        <p className="text-muted" style={{ marginBottom: '24px', fontSize: '0.95rem', lineHeight: 1.5 }}>
          {message || t('deleteWarning') || '¿Estás seguro que deseas eliminar este elemento? Esta acción no se puede deshacer.'}
        </p>
        <div className="d-flex justify-content-center gap-3" style={{ flexWrap: 'wrap' }}>
          <button className="btn btn-outline" onClick={onCancel} style={{ flex: 1 }}>
            {t('cancel') || 'Cancelar'}
          </button>
          <button className="btn btn-danger" onClick={onConfirm} style={{ flex: 1, display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '8px' }}>
            <Trash2 size={16} />
            {t('delete') || 'Eliminar'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default DeleteConfirmModal;
