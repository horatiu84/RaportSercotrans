import { useState, useEffect } from 'react'
import Calendar from './components/Calendar'
import EmployeeLogin from './components/EmployeeLogin'
import './App.css'

function App() {
  const [employeeName, setEmployeeName] = useState('')
  const [isLoggedIn, setIsLoggedIn] = useState(false)

  // Încarcă numele angajatului din localStorage la inițializare
  useEffect(() => {
    const savedEmployeeName = localStorage.getItem('sercotrans-employee-name')
    if (savedEmployeeName && savedEmployeeName.trim() !== '') {
      setEmployeeName(savedEmployeeName)
      setIsLoggedIn(true)
    }
  }, [])

  const handleEmployeeLogin = (name) => {
    setEmployeeName(name)
    setIsLoggedIn(true)
    localStorage.setItem('sercotrans-employee-name', name)
  }

  const handleChangeEmployee = () => {
    setIsLoggedIn(false)
    setEmployeeName('')
    localStorage.removeItem('sercotrans-employee-name')
  }

  if (!isLoggedIn) {
    return <EmployeeLogin onEmployeeLogin={handleEmployeeLogin} />
  }

  return (
    <div className="app">
      <header className="app-header">
        <h1>Raport Lunar - Sercotrans</h1>
      </header>
      <main>
        <Calendar 
          employeeName={employeeName}
          onChangeEmployee={handleChangeEmployee}
        />
      </main>
    </div>
  )
}

export default App
