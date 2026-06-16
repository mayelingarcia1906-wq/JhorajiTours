import { AlertTriangle, Trash2, X } from 'lucide-react';

const DeleteConfirmModal = ({ isOpen, onCancel, onConfirm, title, message }) => {
  if (!isOpen) return null;

  return (
    <div className="modal-overlay" onClick={onCancel}>
      <div
        className="modal-content"
        onClick={(e) => e.stopPropagation()}
        style={{ maxWidth: 440, padding: '1.5rem' }}
      >
        <div style={{ display: 'flex', alignItems: 'flex-start', gap: '1rem', marginBottom: '1.25rem' }}>
          <div
            style={{
              width: 48, height: 48, borderRadius: 'var(--radius-lg)',
              background: 'var(--danger-soft)', color: 'var(--danger)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              flexShrink: 0,
            }}
          >
            <AlertTriangle size={22} />
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <h3 style={{ margin: 0, marginBottom: 4, fontSize: '1.05rem' }}>{title || '¿Confirmar eliminación?'}</h3>
            <p style={{ margin: 0, color: 'var(--text-light)', fontSize: '0.88rem', lineHeight: 1.5 }}>
              {message || 'Esta acción no se puede deshacer.'}
            </p>
          </div>
          <button className="modal-close" onClick={onCancel} aria-label="Cerrar" style={{ width: 28, height: 28 }}>
            <X size={16} />
          </button>
        </div>

        <div className="modal-actions" style={{ marginTop: 0 }}>
          <button type="button" className="btn btn-outline" onClick={onCancel}>
            Cancelar
          </button>
          <button type="button" className="btn btn-danger" onClick={onConfirm}>
            <Trash2 size={15} /> Sí, eliminar
          </button>
        </div>
      </div>
    </div>
  );
};

export default DeleteConfirmModal;
