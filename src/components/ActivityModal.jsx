import { useState, useEffect } from 'react'
import './ActivityModal.css'

const ActivityModal = ({ date, activity, onSave, onClose }) => {
  const [activityText, setActivityText] = useState(activity)

  useEffect(() => {
    setActivityText(activity)
  }, [activity])

  const handleSave = () => {
    onSave(date, activityText)
    onClose()
  }

  const formatDate = (date) => {
    return date.toLocaleDateString('ro-RO', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    })
  }

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        onClose()
      }
    }

    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [onClose])

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h3>Activități pentru {formatDate(date)}</h3>
          <button className="close-button" onClick={onClose}>
            ×
          </button>
        </div>
        
        <div className="modal-body">
          <label htmlFor="activity-input">
            Descrierea activităților:
          </label>
          <textarea
            id="activity-input"
            value={activityText}
            onChange={(e) => setActivityText(e.target.value)}
            placeholder="Introduceți activitățile desfășurate în această zi..."
            rows={6}
            autoFocus
          />
        </div>
        
        <div className="modal-footer">
          <button className="cancel-button" onClick={onClose}>
            Anulează
          </button>
          <button className="save-button" onClick={handleSave}>
            Salvează
          </button>
        </div>
      </div>
    </div>
  )
}

export default ActivityModal