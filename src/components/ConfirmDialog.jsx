import './ConfirmDialog.css'

const ConfirmDialog = ({ 
  isOpen, 
  title, 
  message, 
  confirmText = 'Confirmă', 
  cancelText = 'Anulează', 
  onConfirm, 
  onCancel,
  type = 'warning' // warning, danger, info
}) => {
  if (!isOpen) return null

  const getIcon = () => {
    switch (type) {
      case 'danger':
        return '🗑️'
      case 'warning':
        return '⚠️'
      case 'info':
        return 'ℹ️'
      default:
        return '❓'
    }
  }

  return (
    <div className="confirm-dialog-overlay">
      <div className="confirm-dialog">
        <div className={`confirm-dialog-header ${type}`}>
          <span className="confirm-dialog-icon">{getIcon()}</span>
          <h3 className="confirm-dialog-title">{title}</h3>
        </div>
        
        <div className="confirm-dialog-body">
          <p className="confirm-dialog-message">{message}</p>
        </div>
        
        <div className="confirm-dialog-footer">
          <button 
            className="confirm-dialog-cancel"
            onClick={onCancel}
          >
            {cancelText}
          </button>
          <button 
            className={`confirm-dialog-confirm ${type}`}
            onClick={onConfirm}
          >
            {confirmText}
          </button>
        </div>
      </div>
    </div>
  )
}

export default ConfirmDialog