import './MonthView.css'

const MonthView = ({ currentMonth, onDayClick, getActivity, isNationalHoliday }) => {
  const today = new Date()
  
  // Obține prima zi a lunii și numărul de zile
  const firstDay = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), 1)
  const lastDay = new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 0)
  const daysInMonth = lastDay.getDate()
  const startingDayOfWeek = firstDay.getDay()
  
  // Ajustează pentru ca lunea să fie prima zi (0 = duminică în JS)
  const adjustedStartingDay = startingDayOfWeek === 0 ? 6 : startingDayOfWeek - 1

  const days = []
  
  // Adaugă zilele goale de la începutul lunii
  for (let i = 0; i < adjustedStartingDay; i++) {
    days.push(null)
  }
  
  // Adaugă toate zilele lunii
  for (let day = 1; day <= daysInMonth; day++) {
    days.push(new Date(currentMonth.getFullYear(), currentMonth.getMonth(), day))
  }

  const getDayClass = (date) => {
    if (!date) return 'empty-day'
    
    const dayOfWeek = date.getDay()
    const isWeekend = dayOfWeek === 0 || dayOfWeek === 6 // Duminică sau Sâmbătă
    const holiday = isNationalHoliday(date) // Verifică dacă este sărbătoare legală
    const isToday = date.toDateString() === today.toDateString()
    const isFuture = date > today
    const activity = getActivity(date)
    
    // Verifică dacă există activitate (string sau obiect)
    const hasActivity = activity && (
      (typeof activity === 'string' && activity.trim() !== '') ||
      (typeof activity === 'object' && (activity.isVacation || (activity.projects && activity.projects.length > 0)))
    )
    
    let classes = ['calendar-day']
    
    if (isWeekend) classes.push('weekend')
    if (holiday) classes.push('national-holiday') // Clasă nouă pentru sărbători
    if (isToday) classes.push('today')
    if (isFuture) classes.push('future')
    if (hasActivity) classes.push('has-activity')
    if (activity && activity.isVacation) classes.push('vacation-day')
    
    return classes.join(' ')
  }

  const dayNames = ['Lun', 'Mar', 'Mie', 'Joi', 'Vin', 'Sâm', 'Dum']

  return (
    <div className="month-view">
      <div className="day-headers">
        {dayNames.map(dayName => (
          <div key={dayName} className="day-header">
            {dayName}
          </div>
        ))}
      </div>
      
      <div className="days-grid">
        {days.map((date, index) => (
          <div
            key={index}
            className={getDayClass(date)}
            onClick={() => date && onDayClick(date)}
          >
            {date && (
              <>
                <span className="day-number">{date.getDate()}</span>
                {(() => {
                  const holiday = isNationalHoliday(date)
                  
                  // Afișează sărbătoarea legală dacă există
                  if (holiday) {
                    return (
                      <div className="holiday-indicator">
                        <div className="holiday-icon">🎉</div>
                        <div className="holiday-name">{holiday.name}</div>
                      </div>
                    )
                  }
                  
                  const activity = getActivity(date)
                  
                  if (!activity) return null
                  
                  // Format nou - obiect cu concediu
                  if (activity.isVacation) {
                    return (
                      <div className="vacation-indicator">
                        <div className="vacation-icon">🏖️</div>
                        <div className="vacation-text">Concediu</div>
                        <div className="vacation-hours">{activity.vacationHours || 8}h</div>
                      </div>
                    )
                  }
                  
                  // Format nou - obiect cu proiecte
                  if (activity.projects && activity.projects.length > 0) {
                    const totalHours = activity.projects.reduce((sum, p) => sum + p.hours, 0)
                    return (
                      <div className="activity-indicator">
                        <div className="activity-summary">
                          <span className="total-hours">{totalHours}h</span>
                          <span className="projects-count">
                            {activity.projects.length} proiect{activity.projects.length > 1 ? 'e' : ''}
                          </span>
                        </div>
                        <div className="projects-preview">
                          {activity.projects.slice(0, 2).map((project, idx) => (
                            <div key={idx} className="project-preview">
                              {project.description.substring(0, 15)}
                              {project.description.length > 15 ? '...' : ''}
                            </div>
                          ))}
                          {activity.projects.length > 2 && (
                            <div className="more-projects">
                              +{activity.projects.length - 2} mai mult{activity.projects.length - 2 > 1 ? 'e' : ''}
                            </div>
                          )}
                        </div>
                      </div>
                    )
                  }
                  
                  // Format vechi - string simplu
                  if (typeof activity === 'string' && activity.trim() !== '') {
                    return (
                      <div className="activity-indicator">
                        <span className="activity-text">
                          {activity.substring(0, 20)}
                          {activity.length > 20 ? '...' : ''}
                        </span>
                      </div>
                    )
                  }
                  
                  return null
                })()}
              </>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}

export default MonthView