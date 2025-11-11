import { useState, useEffect } from 'react'
import './ActivityModal.css'

const ActivityModal = ({ date, activity, projects, onSave, onClose }) => {
  // Normalizează projectId la string la inițializare
  const normalizeActivities = (activities) => {
    return (activities || []).map(pa => ({
      ...pa,
      projectId: String(pa.projectId)
    }))
  }

  // Normalizează și projects IDs
  const normalizedProjects = projects.map(p => ({
    ...p,
    id: String(p.id)
  }))

  const [projectActivities, setProjectActivities] = useState(normalizeActivities(activity.projects))
  const [isVacation, setIsVacation] = useState(activity.isVacation || false)
  const [vacationHours, setVacationHours] = useState(activity.vacationHours || 8)

  useEffect(() => {
    setProjectActivities(normalizeActivities(activity.projects))
    setIsVacation(activity.isVacation || false)
    setVacationHours(activity.vacationHours || 8)
  }, [activity])

  const handleSave = () => {
    if (isVacation) {
      // Pentru concediu, salvăm doar datele de concediu
      onSave(date, [], true, vacationHours)
    } else {
      // Filtrează doar activitățile cu ore > 0 și descriere
      const validActivities = projectActivities.filter(pa => 
        pa.hours > 0 && pa.description.trim() !== ''
      )
      onSave(date, validActivities, false, 0)
    }
    onClose()
  }

  const addProjectActivity = () => {
    const firstAvailableProject = normalizedProjects.find(p => 
      !projectActivities.some(pa => pa.projectId === p.id)
    )
    
    if (firstAvailableProject) {
      setProjectActivities([...projectActivities, {
        projectId: firstAvailableProject.id,
        hours: 1,
        description: ''
      }])
    }
  }

  const removeProjectActivity = (index) => {
    setProjectActivities(projectActivities.filter((_, i) => i !== index))
  }

  const updateProjectActivity = (index, field, value) => {
    console.log('updateProjectActivity called:', { index, field, value, currentValue: projectActivities[index]?.[field] })
    const updated = [...projectActivities]
    // Convertește projectId la string pentru consistență
    if (field === 'projectId') {
      value = String(value)
      console.log('Converting projectId to string:', value)
      console.log('Available projects:', normalizedProjects.map(p => ({ id: p.id, name: p.name })))
    }
    updated[index] = { ...updated[index], [field]: value }
    console.log('Updated project activity:', updated[index])
    console.log('All project activities after update:', updated)
    setProjectActivities(updated)
  }

  const getTotalHours = () => {
    if (isVacation) {
      return vacationHours
    }
    return projectActivities.reduce((sum, pa) => sum + (pa.hours || 0), 0)
  }

  const getProjectName = (projectId) => {
    console.log('getProjectName called with:', projectId, 'type:', typeof projectId)
    const project = normalizedProjects.find(p => {
      console.log('Comparing', p.id, 'type:', typeof p.id, 'with', projectId, 'equal:', p.id === projectId)
      return p.id === projectId
    })
    const name = project ? project.name : 'Proiect necunoscut'
    console.log('Result:', name)
    return name
  }

  const getAvailableProjects = () => {
    return normalizedProjects.filter(p => 
      !projectActivities.some(pa => pa.projectId === p.id)
    )
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
          <div className="vacation-toggle-section">
            <label className="vacation-toggle">
              <input
                type="checkbox"
                checked={isVacation}
                onChange={(e) => setIsVacation(e.target.checked)}
              />
              <span className="vacation-label">🏖️ Concediu de Odihnă</span>
            </label>
          </div>

          {isVacation ? (
            <div className="vacation-section">
              <div className="vacation-hours-input">
                <label>Ore concediu:</label>
                <input
                  type="number"
                  value={vacationHours}
                  onChange={(e) => setVacationHours(parseInt(e.target.value) || 8)}
                  min="1"
                  max="24"
                  step="0.5"
                  className="hours-input"
                />
                <span className="hours-label">ore</span>
              </div>
              <div className="vacation-info">
                📅 Această zi va fi marcată ca Concediu de Odihnă în raport
              </div>
            </div>
          ) : (
            <div className="project-activities-section">
              <div className="activities-header">
                <h4>Activități pe proiecte</h4>
                <div className="total-hours">
                  Total ore: <strong>{getTotalHours()}h</strong>
                </div>
              </div>

              <div className="project-activities-list">
                {projectActivities.map((pa, index) => (
                  <div key={index} className="project-activity-item">
                    <div className="project-activity-header">
                      <select
                        value={pa.projectId}
                        onChange={(e) => updateProjectActivity(index, 'projectId', e.target.value)}
                        className="project-select"
                      >
                        {/* Afișează proiectul curent, chiar dacă nu mai există */}
                        {!normalizedProjects.find(p => p.id === pa.projectId) && (
                          <option value={pa.projectId}>
                            {getProjectName(pa.projectId)} ⚠️
                          </option>
                        )}
                        {/* Afișează toate proiectele existente */}
                        {normalizedProjects.map(project => (
                          <option key={project.id} value={project.id}>
                            {project.name}
                          </option>
                        ))}
                      </select>
                      
                      <div className="hours-input-container">
                        <input
                          type="number"
                          value={pa.hours}
                          onChange={(e) => updateProjectActivity(index, 'hours', parseInt(e.target.value) || 0)}
                          min="0"
                          max="24"
                          step="0.5"
                          className="hours-input"
                        />
                        <span className="hours-label">ore</span>
                      </div>

                      <button
                        type="button"
                        onClick={() => removeProjectActivity(index)}
                        className="remove-project-button"
                        title="Șterge activitatea"
                      >
                        🗑️
                      </button>
                    </div>

                    <textarea
                      value={pa.description}
                      onChange={(e) => updateProjectActivity(index, 'description', e.target.value)}
                      placeholder={`Descrierea activităților pentru ${getProjectName(pa.projectId)}...`}
                      rows={3}
                      className="project-description"
                    />
                  </div>
                ))}
              </div>

              {getAvailableProjects().length > 0 && (
                <button
                  type="button"
                  onClick={addProjectActivity}
                  className="add-project-activity-button"
                >
                  ➕ Adaugă proiect
                </button>
              )}
            </div>
          )}
        </div>
        
        <div className="modal-footer">
          <button className="cancel-button" onClick={onClose}>
            Anulează
          </button>
          <button 
            className="save-button" 
            onClick={handleSave}
            disabled={!isVacation && projectActivities.every(pa => pa.hours === 0 || pa.description.trim() === '')}
          >
            Salvează ({getTotalHours()}h)
          </button>
        </div>
      </div>
    </div>
  )
}

export default ActivityModal