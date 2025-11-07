import { useState, useEffect } from 'react'
import MonthView from './MonthView'
import ActivityModal from './ActivityModal'
import * as XLSX from 'xlsx'
import './Calendar.css'

const Calendar = ({ employeeName, onChangeEmployee }) => {
  const [currentDate, setCurrentDate] = useState(new Date())
  const [selectedDate, setSelectedDate] = useState(null)
  const [activities, setActivities] = useState({})
  const [showModal, setShowModal] = useState(false)

  // Încarcă activitățile din localStorage la inițializare
  useEffect(() => {
    const savedActivities = localStorage.getItem('sercotrans-activities')
    if (savedActivities) {
      const oldActivities = JSON.parse(savedActivities)
      console.log('Activități vechi încărcate din localStorage:', oldActivities)
      
      // Migrează activitățile de la format UTC la format local
      const migratedActivities = {}
      Object.entries(oldActivities).forEach(([oldKey, activity]) => {
        if (activity && activity.trim() !== '') {
          // Încearcă să parseze data din cheia veche
          const oldDate = new Date(oldKey + 'T12:00:00') // Adaugă timp la mijlocul zilei pentru a evita problemele de timezone
          const newKey = getDateKey(oldDate)
          migratedActivities[newKey] = activity
          console.log(`Migrare: ${oldKey} -> ${newKey}`)
        }
      })
      
      console.log('Activități migrate:', migratedActivities)
      setActivities(migratedActivities)
      
      // Salvează activitățile migrate
      localStorage.setItem('sercotrans-activities', JSON.stringify(migratedActivities))
    }
  }, [])



  // Salvează activitățile în localStorage când se modifică
  useEffect(() => {
    // Nu salva obiectul gol inițial
    if (Object.keys(activities).length > 0) {
      localStorage.setItem('sercotrans-activities', JSON.stringify(activities))
    }
  }, [activities])



  const getCurrentMonth = () => {
    return new Date(currentDate.getFullYear(), currentDate.getMonth(), 1)
  }

  const navigateMonth = (direction) => {
    const newDate = new Date(currentDate)
    newDate.setMonth(currentDate.getMonth() + direction)
    
    // Nu permite navigarea în viitor (după luna curentă)
    const today = new Date()
    const currentMonthYear = today.getFullYear()
    const currentMonthIndex = today.getMonth()
    
    // Pentru navigarea înapoi, nu avem restricții
    // Pentru navigarea înainte, nu permitem să trecem de luna curentă
    if (direction < 0 || 
        (newDate.getFullYear() < currentMonthYear) ||
        (newDate.getFullYear() === currentMonthYear && newDate.getMonth() <= currentMonthIndex)) {
      setCurrentDate(newDate)
    }
  }

  const handleDayClick = (date) => {
    // Nu permite selectarea zilelor din viitor
    const today = new Date()
    today.setHours(23, 59, 59, 999) // Setează la sfârșitul zilei
    
    if (date <= today) {
      setSelectedDate(date)
      setShowModal(true)
    }
  }

  // Funcție helper pentru a obține cheia datei în timezone local
  const getDateKey = (date) => {
    const year = date.getFullYear()
    const month = String(date.getMonth() + 1).padStart(2, '0')
    const day = String(date.getDate()).padStart(2, '0')
    return `${year}-${month}-${day}`
  }

  const saveActivity = (date, activityText) => {
    const dateKey = getDateKey(date)
    setActivities(prev => ({
      ...prev,
      [dateKey]: activityText
    }))
  }

  const getActivity = (date) => {
    const dateKey = getDateKey(date)
    return activities[dateKey] || ''
  }

  const canNavigateNext = () => {
    const today = new Date()
    const currentYear = today.getFullYear()
    const currentMonth = today.getMonth()
    
    const displayedYear = currentDate.getFullYear()
    const displayedMonth = currentDate.getMonth()
    
    // Poate naviga înainte doar dacă luna afișată este înainte de luna curentă
    return (displayedYear < currentYear) || 
           (displayedYear === currentYear && displayedMonth < currentMonth)
  }

  const exportToExcel = () => {
    if (!employeeName.trim()) {
      alert('Vă rugăm să introduceți numele angajatului înainte de export!')
      return
    }

    // Pregătește datele pentru export
    const exportData = []
    
    // Header-ul
    exportData.push([
      'Raport Lunar - Sercotrans',
      '',
      '',
      ''
    ])
    exportData.push([
      `Angajat: ${employeeName}`,
      '',
      '',
      ''
    ])
    exportData.push([
      `Luna: ${currentDate.toLocaleDateString('ro-RO', { year: 'numeric', month: 'long' })}`,
      '',
      '',
      ''
    ])
    exportData.push(['']) // Linie goală

    // Header-ul tabelului
    exportData.push(['Data', 'Ziua', 'Activități', 'Status'])

    // Sortează activitățile după dată
    const sortedActivities = Object.entries(activities)
      .filter(([dateKey, activity]) => {
        // Parse-ează data din cheia în format YYYY-MM-DD
        const [year, month, day] = dateKey.split('-').map(Number)
        const activityDate = new Date(year, month - 1, day) // month - 1 pentru că getMonth() returnează 0-11
        
        return activityDate.getFullYear() === currentDate.getFullYear() &&
               activityDate.getMonth() === currentDate.getMonth() &&
               activity.trim() !== ''
      })
      .sort(([dateA], [dateB]) => {
        const [yearA, monthA, dayA] = dateA.split('-').map(Number)
        const [yearB, monthB, dayB] = dateB.split('-').map(Number)
        const dateObjA = new Date(yearA, monthA - 1, dayA)
        const dateObjB = new Date(yearB, monthB - 1, dayB)
        return dateObjA - dateObjB
      })

    // Adaugă fiecare activitate
    sortedActivities.forEach(([dateKey, activity]) => {
      // Parse-ează data din cheia în format YYYY-MM-DD
      const [year, month, day] = dateKey.split('-').map(Number)
      const date = new Date(year, month - 1, day) // month - 1 pentru că constructorul Date folosește 0-11
      const dayOfWeek = date.getDay()
      const isWeekend = dayOfWeek === 0 || dayOfWeek === 6
      
      exportData.push([
        date.toLocaleDateString('ro-RO'),
        date.toLocaleDateString('ro-RO', { weekday: 'long' }),
        activity,
        isWeekend ? 'Weekend' : 'Zi lucrătoare'
      ])
    })

    // Statistici
    exportData.push(['']) // Linie goală
    exportData.push(['Statistici:', '', '', ''])
    exportData.push([`Total zile cu activități: ${sortedActivities.length}`, '', '', ''])
    
    const workDays = sortedActivities.filter(([dateKey]) => {
      const [year, month, day] = dateKey.split('-').map(Number)
      const date = new Date(year, month - 1, day)
      const dayOfWeek = date.getDay()
      return dayOfWeek !== 0 && dayOfWeek !== 6
    }).length
    
    exportData.push([`Zile lucrătoare: ${workDays}`, '', '', ''])

    // Creează workbook-ul
    const wb = XLSX.utils.book_new()
    const ws = XLSX.utils.aoa_to_sheet(exportData)

    // Setează lățimea coloanelor
    ws['!cols'] = [
      { width: 15 }, // Data
      { width: 15 }, // Ziua
      { width: 50 }, // Activități
      { width: 15 }  // Status
    ]

    // Adaugă worksheet-ul la workbook
    XLSX.utils.book_append_sheet(wb, ws, 'Raport Lunar')

    // Salvează fișierul
    const fileName = `Raport_${employeeName.replace(/\s+/g, '_')}_${currentDate.toLocaleDateString('ro-RO', { year: 'numeric', month: '2-digit' }).replace(/\./g, '-')}.xlsx`
    XLSX.writeFile(wb, fileName)
  }

  return (
    <div className="calendar-container">
      <div className="employee-header">
        <h3>👤 {employeeName}</h3>
        <button 
          className="change-employee-button"
          onClick={onChangeEmployee}
          title="Schimbă angajatul"
        >
          Schimbă utilizatorul
        </button>
      </div>

      <div className="calendar-header">
        <div className="nav-section">
          <button 
            className="nav-button"
            onClick={() => navigateMonth(-1)}
          >
            ← Luna anterioară
          </button>
          <h2>
            {currentDate.toLocaleDateString('ro-RO', { 
              year: 'numeric', 
              month: 'long' 
            })}
          </h2>
          <button 
            className="nav-button"
            onClick={() => navigateMonth(1)}
            disabled={!canNavigateNext()}
          >
            Luna următoare →
          </button>
        </div>
        <button 
          className="export-button"
          onClick={exportToExcel}
          title="Exportă raportul în Excel"
        >
          📊 Export Excel
        </button>
      </div>

      <MonthView
        currentMonth={getCurrentMonth()}
        onDayClick={handleDayClick}
        activities={activities}
        getActivity={getActivity}
      />

      {showModal && selectedDate && (
        <ActivityModal
          date={selectedDate}
          activity={getActivity(selectedDate)}
          onSave={saveActivity}
          onClose={() => {
            setShowModal(false)
            setSelectedDate(null)
          }}
        />
      )}
    </div>
  )
}

export default Calendar