import './MonthView.css'

const MonthView = ({ currentMonth, onDayClick, getActivity }) => {
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
    const isToday = date.toDateString() === today.toDateString()
    const isFuture = date > today
    const hasActivity = getActivity(date).trim() !== ''
    
    let classes = ['calendar-day']
    
    if (isWeekend) classes.push('weekend')
    if (isToday) classes.push('today')
    if (isFuture) classes.push('future')
    if (hasActivity) classes.push('has-activity')
    
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
                {getActivity(date) && (
                  <div className="activity-indicator">
                    <span className="activity-text">
                      {getActivity(date).substring(0, 20)}
                      {getActivity(date).length > 20 ? '...' : ''}
                    </span>
                  </div>
                )}
              </>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}

export default MonthView