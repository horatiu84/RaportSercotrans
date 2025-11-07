import { useState } from 'react'
import './EmployeeLogin.css'

const EmployeeLogin = ({ onEmployeeLogin }) => {
  const [name, setName] = useState('')
  const [isLoading, setIsLoading] = useState(false)

  const handleSubmit = (e) => {
    e.preventDefault()
    if (name.trim()) {
      setIsLoading(true)
      // Simulează o mică întârziere pentru experiența utilizatorului
      setTimeout(() => {
        onEmployeeLogin(name.trim())
        setIsLoading(false)
      }, 500)
    }
  }

  const handleKeyPress = (e) => {
    if (e.key === 'Enter') {
      handleSubmit(e)
    }
  }

  return (
    <div className="login-container">
      <div className="login-card">
        <div className="company-header">
          <h1> 🛣️ Sercotrans</h1>
          <p>Sistem de Raportare Lunară</p>
        </div>
        
        <form onSubmit={handleSubmit} className="login-form">
          <div className="welcome-section">
            <h2>Bine ați venit!</h2>
            <p>Pentru a continua, vă rugăm să vă introduceți numele:</p>
          </div>
          
          <div className="input-section">
            <label htmlFor="employee-name">
              Nume și Prenume
            </label>
            <input
              id="employee-name"
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="Ex: Ion Popescu"
              className="name-input"
              disabled={isLoading}
              autoFocus
              required
            />
          </div>
          
          <button 
            type="submit" 
            className="login-button"
            disabled={!name.trim() || isLoading}
          >
            {isLoading ? (
              <>
                <span className="spinner"></span>
                Se încarcă...
              </>
            ) : (
              'Continuă la Calendar'
            )}
          </button>
        </form>
        
        <div className="footer-info">
          <p>Numele va fi salvat pentru sesiunile viitoare</p>
        </div>
      </div>
    </div>
  )
}

export default EmployeeLogin