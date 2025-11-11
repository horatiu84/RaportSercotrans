import { useState, useEffect } from 'react'
import MonthView from './MonthView'
import ActivityModal from './ActivityModal'
import ProjectManager from './ProjectManager'
import * as XLSX from 'xlsx'
import './Calendar.css'

// Funcție pentru calcularea Paștelui Ortodox (algoritm Meeus/Jones/Butcher)
const getOrthodoxEaster = (year) => {
  const a = year % 4
  const b = year % 7
  const c = year % 19
  const d = (19 * c + 15) % 30
  const e = (2 * a + 4 * b - d + 34) % 7
  const month = Math.floor((d + e + 114) / 31)
  const day = ((d + e + 114) % 31) + 1
  
  // Adaugă 13 zile pentru calendarul Iulian -> Gregorian
  const easterDate = new Date(year, month - 1, day)
  easterDate.setDate(easterDate.getDate() + 13)
  
  return easterDate
}

// Funcție pentru a obține toate sărbătorile legale dintr-un an
const getNationalHolidays = (year) => {
  const easter = getOrthodoxEaster(year)
  const easterMonth = easter.getMonth()
  const easterDay = easter.getDate()
  
  const holidays = [
    { month: 0, day: 1, name: 'Anul Nou' },
    { month: 0, day: 2, name: 'Anul Nou' },
    { month: 0, day: 24, name: 'Ziua Unirii Principatelor Române' },
    { month: 4, day: 1, name: 'Ziua Muncii' },
    { month: 5, day: 1, name: 'Ziua Copilului' },
    { month: 7, day: 15, name: 'Adormirea Maicii Domnului' },
    { month: 10, day: 30, name: 'Sfântul Andrei' },
    { month: 11, day: 1, name: 'Ziua Națională a României' },
    { month: 11, day: 25, name: 'Crăciunul' },
    { month: 11, day: 26, name: 'Crăciunul' },
    // Sărbători mobile (calculate în funcție de Paște)
    { month: easterMonth, day: easterDay - 2, name: 'Vinerea Mare' },
    { month: easterMonth, day: easterDay, name: 'Paștele' },
    { month: easterMonth, day: easterDay + 1, name: 'Paștele' },
    { month: easterMonth, day: easterDay + 49, name: 'Rusaliile' },
    { month: easterMonth, day: easterDay + 50, name: 'Rusaliile' }
  ]
  
  // Ajustează zilele care depășesc luna
  return holidays.map(h => {
    const date = new Date(year, h.month, h.day)
    return {
      month: date.getMonth(),
      day: date.getDate(),
      name: h.name
    }
  })
}

// Funcție pentru a verifica dacă o dată este sărbătoare legală
const isNationalHoliday = (date) => {
  const year = date.getFullYear()
  const month = date.getMonth()
  const day = date.getDate()
  
  const holidays = getNationalHolidays(year)
  return holidays.find(h => h.month === month && h.day === day)
}

const Calendar = ({ employeeName, onChangeEmployee }) => {
  const [currentDate, setCurrentDate] = useState(new Date())
  const [selectedDate, setSelectedDate] = useState(null)
  const [activities, setActivities] = useState({})
  const [showModal, setShowModal] = useState(false)
  const [showProjectManager, setShowProjectManager] = useState(false)
  const [projects, setProjects] = useState([
    { id: '1', name: 'Proiect 1', description: 'Descriere proiect 1' },
    { id: '2', name: 'Proiect 2', description: 'Descriere proiect 2' }
  ])

  // Încarcă activitățile din localStorage la inițializare
  useEffect(() => {
    const savedActivities = localStorage.getItem('sercotrans-activities')
    if (savedActivities) {
      const oldActivities = JSON.parse(savedActivities)
      console.log('Activități vechi încărcate din localStorage:', oldActivities)
      
      // Migrează activitățile de la format UTC la format local
      const migratedActivities = {}
      Object.entries(oldActivities).forEach(([oldKey, activity]) => {
        // Verifică dacă activitatea este un string simplu (format vechi) sau un obiect (format nou)
        if (activity && typeof activity === 'string' && activity.trim() !== '') {
          // Format vechi - string simplu
          const oldDate = new Date(oldKey + 'T12:00:00')
          const newKey = getDateKey(oldDate)
          migratedActivities[newKey] = activity
          console.log(`Migrare string: ${oldKey} -> ${newKey}`)
        } else if (activity && typeof activity === 'object') {
          // Format nou - obiect cu proiecte sau concediu
          const oldDate = new Date(oldKey + 'T12:00:00')
          const newKey = getDateKey(oldDate)
          migratedActivities[newKey] = activity
          console.log(`Migrare obiect: ${oldKey} -> ${newKey}`)
        }
      })
      
      console.log('Activități migrate:', migratedActivities)
      setActivities(migratedActivities)
      
      // Salvează activitățile migrate
      localStorage.setItem('sercotrans-activities', JSON.stringify(migratedActivities))
    }

    const storedProjects = localStorage.getItem('projects')
    if (storedProjects) {
      setProjects(JSON.parse(storedProjects))
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

  const saveActivity = (date, projectsData, isVacation = false, vacationHours = 8) => {
    const dateKey = getDateKey(date)
    const newActivities = { ...activities }
    
    if (isVacation) {
      newActivities[dateKey] = {
        isVacation: true,
        vacationHours: vacationHours
      }
    } else if (projectsData && projectsData.length > 0) {
      newActivities[dateKey] = {
        isVacation: false,
        projects: projectsData
      }
    } else {
      delete newActivities[dateKey]
    }
    
    setActivities(newActivities)
  }

  const getActivity = (date) => {
    const dateKey = getDateKey(date)
    const activity = activities[dateKey]
    
    // Returnează activitatea sau un obiect gol pentru backwards compatibility
    if (!activity) {
      return { projects: [], isVacation: false, vacationHours: 8 }
    }
    
    // Dacă e string (format vechi), convertește-l la format nou
    if (typeof activity === 'string') {
      return {
        projects: [],
        isVacation: false,
        vacationHours: 8,
        legacyText: activity // păstrăm textul vechi pentru afișare
      }
    }
    
    return activity
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

    const allProjectActivities = []
    const allVacations = []
    const allHolidays = []
    
    // Adaugă toate sărbătorile legale din luna curentă
    const year = currentDate.getFullYear()
    const month = currentDate.getMonth()
    const holidays = getNationalHolidays(year)
    
    holidays.forEach(holiday => {
      if (holiday.month === month) {
        const holidayDate = new Date(year, holiday.month, holiday.day)
        const dateKey = getDateKey(holidayDate)
        
        // Verifică dacă nu există deja o activitate pentru această zi
        if (!activities[dateKey] || (!activities[dateKey].isVacation && (!activities[dateKey].projects || activities[dateKey].projects.length === 0))) {
          allHolidays.push({
            dateKey,
            date: holidayDate,
            name: holiday.name,
            type: 'holiday'
          })
        }
      }
    })
    
    Object.entries(activities).forEach(([dateKey, dayActivity]) => {
      const [year, month, day] = dateKey.split('-').map(Number)
      const activityDate = new Date(year, month - 1, day)
      
      if (activityDate.getFullYear() === currentDate.getFullYear() &&
          activityDate.getMonth() === currentDate.getMonth()) {
        
        if (dayActivity.isVacation) {
          allVacations.push({
            dateKey,
            date: activityDate,
            hours: dayActivity.vacationHours || 8,
            type: 'vacation'
          })
        } else if (dayActivity.projects && dayActivity.projects.length > 0) {
          dayActivity.projects.forEach(project => {
            if (project.hours > 0 && project.description.trim() !== '') {
              allProjectActivities.push({
                dateKey,
                date: activityDate,
                projectId: project.projectId,
                hours: project.hours,
                description: project.description,
                type: 'project'
              })
            }
          })
        }
      }
    })

    const allActivities = [...allProjectActivities, ...allVacations, ...allHolidays]
    allActivities.sort((a, b) => a.date - b.date)

    const groupedByDate = {}
    allActivities.forEach(activity => {
      const dateKey = activity.dateKey
      if (!groupedByDate[dateKey]) {
        groupedByDate[dateKey] = []
      }
      groupedByDate[dateKey].push(activity)
    })

    const worksheetData = [
      ['Raport Lunar - Sercotrans'],
      [`Angajat: ${employeeName}`],
      [`Luna: ${currentDate.toLocaleDateString('ro-RO', { year: 'numeric', month: 'long' })}`],
      [],
      ['Data', 'Ziua', 'Proiect', 'Ore', 'Descriere Activități', 'Status']
    ]

    Object.entries(groupedByDate).forEach(([, dayActivities]) => {
      const firstActivity = dayActivities[0]
      const date = firstActivity.date
      const dayOfWeek = date.getDay()
      const isWeekend = dayOfWeek === 0 || dayOfWeek === 6
      const holiday = isNationalHoliday(date)
      const dateStr = date.toLocaleDateString('ro-RO')
      const dayStr = date.toLocaleDateString('ro-RO', { weekday: 'long' })
      const statusStr = holiday ? `🎉 ${holiday.name}` : (isWeekend ? 'Weekend' : 'Zi lucrătoare')

      dayActivities.forEach((activity, index) => {
        if (activity.type === 'holiday') {
          worksheetData.push([
            index === 0 ? dateStr : '',
            index === 0 ? dayStr : '',
            `🎉 SĂRBĂTOARE LEGALĂ: ${activity.name.toUpperCase()}`,
            0,
            `Zi liberă conform Legii nr. 53/2003 - ${activity.name}`,
            index === 0 ? statusStr : ''
          ])
        } else if (activity.type === 'vacation') {
          worksheetData.push([
            index === 0 ? dateStr : '',
            index === 0 ? dayStr : '',
            '🏖️ CONCEDIU DE ODIHNĂ',
            activity.hours,
            'Concediu de odihnă conform legislației în vigoare',
            index === 0 ? (holiday ? statusStr : 'Concediu') : ''
          ])
        } else {
          // Normalizează ID-urile la string pentru comparație
          const project = projects.find(p => String(p.id) === String(activity.projectId))
          const projectName = project ? project.name : 'Proiect necunoscut'
          
          worksheetData.push([
            index === 0 ? dateStr : '',
            index === 0 ? dayStr : '',
            projectName,
            activity.hours,
            activity.description,
            index === 0 ? statusStr : ''
          ])
        }
      })
    })

    worksheetData.push([])
    worksheetData.push(['Statistici'])
    
    const totalHolidayDays = allHolidays.length
    const totalVacationDays = allVacations.length
    const totalVacationHours = allVacations.reduce((sum, vacation) => sum + vacation.hours, 0)
    const totalProjectHours = allProjectActivities.reduce((sum, pa) => sum + pa.hours, 0)
    const totalHours = totalVacationHours + totalProjectHours
    const uniqueDates = [...new Set(allActivities.map(activity => activity.dateKey))]
    const uniqueWorkDates = [...new Set(allProjectActivities
      .filter(pa => {
        const dayOfWeek = pa.date.getDay()
        return dayOfWeek !== 0 && dayOfWeek !== 6
      })
      .map(pa => pa.dateKey)
    )]

    worksheetData.push([`Total zile cu activități: ${uniqueDates.length}`])
    worksheetData.push([`Zile lucrătoare: ${uniqueWorkDates.length}`])
    worksheetData.push([`Sărbători legale: ${totalHolidayDays}`])
    worksheetData.push([`Zile concediu: ${totalVacationDays}`])
    worksheetData.push([`Total ore lucrate pe proiecte: ${totalProjectHours}h`])
    worksheetData.push([`Total ore concediu: ${totalVacationHours}h`])
    worksheetData.push([`Total ore generale: ${totalHours}h`])

    const worksheet = XLSX.utils.aoa_to_sheet(worksheetData)

    // Merge-uri pentru header și footer
    const merges = [
      { s: { r: 0, c: 0 }, e: { r: 0, c: 5 } }, // Titlu
      { s: { r: 1, c: 0 }, e: { r: 1, c: 5 } }, // Angajat
      { s: { r: 2, c: 0 }, e: { r: 2, c: 5 } }, // Luna
      { s: { r: worksheetData.length - 8, c: 0 }, e: { r: worksheetData.length - 8, c: 5 } } // Statistici (8 în loc de 7)
    ]

    // Adaugă merge-uri pentru zile cu mai multe proiecte
    let currentRow = 5 // Începe după header (rândul 5 = index 4 + 1 pentru aoa_to_sheet)
    Object.entries(groupedByDate).forEach(([, dayActivities]) => {
      if (dayActivities.length > 1) {
        // Merge celulele pentru Data (coloana A = 0)
        merges.push({ s: { r: currentRow, c: 0 }, e: { r: currentRow + dayActivities.length - 1, c: 0 } })
        // Merge celulele pentru Ziua (coloana B = 1)
        merges.push({ s: { r: currentRow, c: 1 }, e: { r: currentRow + dayActivities.length - 1, c: 1 } })
        // Merge celulele pentru Status (coloana F = 5)
        merges.push({ s: { r: currentRow, c: 5 }, e: { r: currentRow + dayActivities.length - 1, c: 5 } })
      }
      currentRow += dayActivities.length
    })

    worksheet['!merges'] = merges

    // Setează lățimea coloanelor pentru o lizibilitate optimă
    worksheet['!cols'] = [
      { wch: 12 },  // A: Data - 12 caractere
      { wch: 12 },  // B: Ziua - 12 caractere
      { wch: 30 },  // C: Proiect - 30 caractere
      { wch: 8 },   // D: Ore - 8 caractere
      { wch: 60 },  // E: Descriere Activități - 60 caractere (cel mai mare)
      { wch: 15 }   // F: Status - 15 caractere
    ]

    // Setează înălțimea rândurilor pentru o vizibilitate mai bună
    worksheet['!rows'] = worksheetData.map((row, index) => {
      if (index === 0) return { hpt: 25 } // Header principal - mai înalt
      if (index === 4) return { hpt: 20 } // Header tabel - mai înalt
      if (index > 4 && index < worksheetData.length - 7) {
        return { hpt: 30 } // Rânduri cu date - mai înalte pentru text
      }
      return { hpt: 18 } // Rânduri normale
    })

    // Adaugă wrap text pentru toate celulele cu date
    const range = XLSX.utils.decode_range(worksheet['!ref'])
    for (let R = range.s.r; R <= range.e.r; ++R) {
      for (let C = range.s.c; C <= range.e.c; ++C) {
        const cellAddress = XLSX.utils.encode_cell({ r: R, c: C })
        if (!worksheet[cellAddress]) continue
        
        // Inițializează obiectul de stil dacă nu există
        if (!worksheet[cellAddress].s) {
          worksheet[cellAddress].s = {}
        }
        
        // Adaugă wrap text pentru toate celulele
        worksheet[cellAddress].s.alignment = { 
          wrapText: true,
          vertical: 'top',
          horizontal: C === 4 ? 'left' : 'center' // Coloana E (Descriere) la stânga
        }
      }
    }

    const workbook = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Raport')

    const fileName = `Raport_${employeeName.replace(/\s+/g, '_')}_${currentDate.toLocaleDateString('ro-RO', { year: 'numeric', month: '2-digit' }).replace(/\./g, '-')}.xlsx`
    XLSX.writeFile(workbook, fileName)
  }

  /* 
  // Funcție exportToPDF - dezactivată momentan
  const exportToPDF = async () => {
    if (!employeeName.trim()) {
      alert('Vă rugăm să introduceți numele angajatului înainte de export!')
      return
    }

    try {
      const { jsPDF } = await import('jspdf')
      const autoTable = (await import('jspdf-autotable')).default

      const allProjectActivities = []
      const allVacations = []
      
      Object.entries(activities).forEach(([dateKey, dayActivity]) => {
        const [year, month, day] = dateKey.split('-').map(Number)
        const activityDate = new Date(year, month - 1, day)
        
        if (activityDate.getFullYear() === currentDate.getFullYear() &&
            activityDate.getMonth() === currentDate.getMonth()) {
          
          if (dayActivity.isVacation) {
            allVacations.push({
              dateKey,
              date: activityDate,
              hours: dayActivity.vacationHours || 8,
              type: 'vacation'
            })
          } else if (dayActivity.projects && dayActivity.projects.length > 0) {
            dayActivity.projects.forEach(project => {
              if (project.hours > 0 && project.description.trim() !== '') {
                allProjectActivities.push({
                  dateKey,
                  date: activityDate,
                  projectId: project.projectId,
                  hours: project.hours,
                  description: project.description,
                  type: 'project'
                })
              }
            })
          }
        }
      })

      const allActivities = [...allProjectActivities, ...allVacations]
      allActivities.sort((a, b) => a.date - b.date)

      const groupedByDate = {}
      allActivities.forEach(activity => {
        const dateKey = activity.dateKey
        if (!groupedByDate[dateKey]) {
          groupedByDate[dateKey] = []
        }
        groupedByDate[dateKey].push(activity)
      })

      const doc = new jsPDF()
      
      doc.setFontSize(18)
      doc.setFont(undefined, 'bold')
      doc.text('Raport Lunar - Sercotrans', 20, 25)
      
      doc.setFontSize(12)
      doc.setFont(undefined, 'normal')
      doc.text(`Angajat: ${employeeName}`, 20, 35)
      doc.text(`Luna: ${currentDate.toLocaleDateString('ro-RO', { year: 'numeric', month: 'long' })}`, 20, 45)

      const tableData = []
      
      Object.entries(groupedByDate).forEach(([, dayActivities]) => {
        const firstActivity = dayActivities[0]
        const date = firstActivity.date
        const dayOfWeek = date.getDay()
        const isWeekend = dayOfWeek === 0 || dayOfWeek === 6
        const dateStr = date.toLocaleDateString('ro-RO')
        const dayStr = date.toLocaleDateString('ro-RO', { weekday: 'long' })
        const statusStr = isWeekend ? 'Weekend' : 'Zi lucrătoare'

        dayActivities.forEach((activity, index) => {
          if (activity.type === 'vacation') {
            tableData.push([
              index === 0 ? dateStr : '',
              index === 0 ? dayStr : '',
              '🏖️ CONCEDIU DE ODIHNĂ',
              activity.hours,
              'Concediu de odihnă conform legislației în vigoare',
              index === 0 ? 'Concediu' : ''
            ])
          } else {
            // Normalizează ID-urile la string pentru comparație
            const project = projects.find(p => String(p.id) === String(activity.projectId))
            const projectName = project ? project.name : 'Proiect necunoscut'
            
            tableData.push([
              index === 0 ? dateStr : '',
              index === 0 ? dayStr : '',
              projectName,
              activity.hours,
              activity.description,
              index === 0 ? statusStr : ''
            ])
          }
        })
      })

      autoTable(doc, {
        head: [['Data', 'Ziua', 'Proiect', 'Ore', 'Descriere Activități', 'Status']],
        body: tableData,
        startY: 55,
        styles: {
          fontSize: 9,
          cellPadding: 3,
          lineColor: [200, 200, 200],
          lineWidth: 0.5,
          textColor: [0, 0, 0]
        },
        headStyles: {
          fillColor: [54, 96, 146],
          textColor: [255, 255, 255],
          fontSize: 10,
          fontStyle: 'bold',
          halign: 'center'
        },
        alternateRowStyles: {
          fillColor: [248, 249, 250]
        },
        columnStyles: {
          0: { cellWidth: 20, halign: 'center' },
          1: { cellWidth: 25, halign: 'center' },
          2: { cellWidth: 35 },
          3: { cellWidth: 15, halign: 'center' },
          4: { cellWidth: 70 },
          5: { cellWidth: 25, halign: 'center' }
        },
        didParseCell: function(data) {
          if (data.cell.text && data.cell.text[0] && data.cell.text[0].includes('CONCEDIU')) {
            data.cell.styles.fillColor = [255, 243, 224]
            data.cell.styles.textColor = [255, 152, 0]
            data.cell.styles.fontStyle = 'bold'
          }
        },
        margin: { top: 55, left: 20, right: 20 }
      })

      const finalY = doc.lastAutoTable.finalY + 20

      const totalVacationDays = allVacations.length
      const totalVacationHours = allVacations.reduce((sum, vacation) => sum + vacation.hours, 0)
      const totalProjectHours = allProjectActivities.reduce((sum, pa) => sum + pa.hours, 0)
      const totalHours = totalVacationHours + totalProjectHours
      const uniqueDates = [...new Set(allActivities.map(activity => activity.dateKey))]
      const uniqueWorkDates = [...new Set(allProjectActivities
        .filter(pa => {
          const dayOfWeek = pa.date.getDay()
          return dayOfWeek !== 0 && dayOfWeek !== 6
        })
        .map(pa => pa.dateKey)
      )]

      doc.setFontSize(14)
      doc.setFont(undefined, 'bold')
      doc.setTextColor(54, 96, 146)
      doc.text('Statistici:', 20, finalY)
      
      doc.setFontSize(11)
      doc.setFont(undefined, 'bold')
      doc.setTextColor(0, 0, 0)
      
      const statsY = finalY + 10
      const lineHeight = 8
      
      doc.text(`Total zile cu activități: ${uniqueDates.length}`, 20, statsY)
      doc.text(`Zile lucrătoare: ${uniqueWorkDates.length}`, 20, statsY + lineHeight)
      doc.text(`Zile concediu: ${totalVacationDays}`, 20, statsY + lineHeight * 2)
      doc.text(`Total ore lucrate pe proiecte: ${totalProjectHours}h`, 20, statsY + lineHeight * 3)
      doc.text(`Total ore concediu: ${totalVacationHours}h`, 20, statsY + lineHeight * 4)
      doc.text(`Total ore generale: ${totalHours}h`, 20, statsY + lineHeight * 5)
      doc.text(`Total intrări activități: ${allProjectActivities.length + allVacations.length}`, 20, statsY + lineHeight * 6)

      const fileName = `Raport_${employeeName.replace(/\s+/g, '_')}_${currentDate.toLocaleDateString('ro-RO', { year: 'numeric', month: '2-digit' }).replace(/\./g, '-')}.pdf`
      doc.save(fileName)
      
    } catch (error) {
      console.error('Error generating PDF:', error)
      alert('Eroare la generarea PDF-ului: ' + error.message)
    }
  }
  */

  const handleProjectsUpdate = (newProjects) => {
    setProjects(newProjects)
    localStorage.setItem('projects', JSON.stringify(newProjects))
  }

  if (showProjectManager) {
    return (
      <div className="calendar-container">
        <ProjectManager
          projects={projects}
          onUpdateProjects={handleProjectsUpdate}
          onClose={() => setShowProjectManager(false)}
        />
      </div>
    )
  }

  return (
    <div className="calendar-container">
      <div className="employee-header">
        <h3>👤 {employeeName}</h3>
        <div className="header-buttons">
          <button 
            className="manage-projects-button"
            onClick={() => setShowProjectManager(true)}
            title="Gestionează proiectele"
          >
            📋 Proiecte ({projects.length})
          </button>
          <button 
            className="change-employee-button"
            onClick={onChangeEmployee}
            title="Schimbă angajatul"
          >
            Schimbă utilizatorul
          </button>
        </div>
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
        <div className="action-buttons">
          <button 
            className="export-button"
            onClick={exportToExcel}
            title="Exportă raportul în Excel"
          >
            📊 Export Excel
          </button>
        </div>
      </div>

      <MonthView
        currentMonth={getCurrentMonth()}
        onDayClick={handleDayClick}
        activities={activities}
        getActivity={getActivity}
        isNationalHoliday={isNationalHoliday}
      />

      {showModal && selectedDate && (
        <ActivityModal
          date={selectedDate}
          activity={getActivity(selectedDate)}
          projects={projects}
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