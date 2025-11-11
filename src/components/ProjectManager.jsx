import { useState } from 'react'
import ConfirmDialog from './ConfirmDialog'
import './ProjectManager.css'

const ProjectManager = ({ projects, onUpdateProjects, onClose }) => {
  const [newProjectName, setNewProjectName] = useState('')
  const [editingProject, setEditingProject] = useState(null)
  const [editName, setEditName] = useState('')
  const [deleteDialog, setDeleteDialog] = useState({ isOpen: false, projectId: null, projectName: '' })

  const handleAddProject = () => {
    if (newProjectName.trim()) {
      const newProject = {
        id: Date.now().toString(),
        name: newProjectName.trim(),
        created: new Date().toISOString()
      }
      onUpdateProjects([...projects, newProject])
      setNewProjectName('')
    }
  }

  const handleEditProject = (project) => {
    setEditingProject(project.id)
    setEditName(project.name)
  }

  const handleSaveEdit = () => {
    if (editName.trim()) {
      const updatedProjects = projects.map(p =>
        p.id === editingProject
          ? { ...p, name: editName.trim() }
          : p
      )
      onUpdateProjects(updatedProjects)
      setEditingProject(null)
      setEditName('')
    }
  }

  const handleCancelEdit = () => {
    setEditingProject(null)
    setEditName('')
  }

  const handleDeleteProject = (projectId) => {
    if (projects.length <= 1) {
      alert('Nu puteți șterge toate proiectele. Trebuie să existe cel puțin un proiect.')
      return
    }
    
    const project = projects.find(p => p.id === projectId)
    setDeleteDialog({
      isOpen: true,
      projectId: projectId,
      projectName: project.name
    })
  }

  const handleConfirmDelete = () => {
    const updatedProjects = projects.filter(p => p.id !== deleteDialog.projectId)
    onUpdateProjects(updatedProjects)
    setDeleteDialog({ isOpen: false, projectId: null, projectName: '' })
  }

  const handleCancelDelete = () => {
    setDeleteDialog({ isOpen: false, projectId: null, projectName: '' })
  }

  return (
    <div className="modal-overlay project-manager-overlay">
      <div className="modal-content project-manager-modal">
        <div className="modal-header">
          <h3>📋 Gestionare Proiecte</h3>
          <button className="close-button" onClick={onClose}>
            ×
          </button>
        </div>

        <div className="modal-body project-manager-body">
          <div className="add-project-section">
            <h4>Adaugă Proiect Nou</h4>
            <div className="add-project-form">
              <input
                type="text"
                value={newProjectName}
                onChange={(e) => setNewProjectName(e.target.value)}
                placeholder="Numele proiectului..."
                className="project-input"
                onKeyPress={(e) => e.key === 'Enter' && handleAddProject()}
              />
              <button 
                onClick={handleAddProject}
                className="add-project-button"
                disabled={!newProjectName.trim()}
              >
                ➕ Adaugă
              </button>
            </div>
          </div>

          <div className="projects-list-section">
            <h4>Proiecte Existente ({projects.length})</h4>
            <div className="projects-list">
              {projects.map((project) => (
                <div key={project.id} className="project-item">
                  {editingProject === project.id ? (
                    <div className="edit-project-form">
                      <input
                        type="text"
                        value={editName}
                        onChange={(e) => setEditName(e.target.value)}
                        className="project-input edit-input"
                        onKeyPress={(e) => {
                          if (e.key === 'Enter') handleSaveEdit()
                          if (e.key === 'Escape') handleCancelEdit()
                        }}
                        autoFocus
                      />
                      <div className="edit-buttons">
                        <button 
                          onClick={handleSaveEdit}
                          className="save-edit-button"
                          disabled={!editName.trim()}
                        >
                          ✓
                        </button>
                        <button 
                          onClick={handleCancelEdit}
                          className="cancel-edit-button"
                        >
                          ✗
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="project-display">
                      <span className="project-name">{project.name}</span>
                      <div className="project-actions">
                        <button 
                          onClick={() => handleEditProject(project)}
                          className="edit-project-button"
                          title="Editează proiectul"
                        >
                          ✏️
                        </button>
                        <button 
                          onClick={() => handleDeleteProject(project.id)}
                          className="delete-project-button"
                          title="Șterge proiectul"
                          disabled={projects.length <= 1}
                        >
                          🗑️
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="modal-footer">
          <button className="close-project-manager-button" onClick={onClose}>
            Închide
          </button>
        </div>
      </div>

      <ConfirmDialog
        isOpen={deleteDialog.isOpen}
        title="Șterge Proiect"
        message={`Sigur doriți să ștergeți proiectul "${deleteDialog.projectName}"? Activitățile asociate nu vor fi șterse.`}
        type="danger"
        confirmText="Șterge"
        cancelText="Anulează"
        onConfirm={handleConfirmDelete}
        onCancel={handleCancelDelete}
      />
    </div>
  )
}

export default ProjectManager