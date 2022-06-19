const bel = require('bel')
const csjs = require('csjs-inject')
const protocol_maker = require('protocol-maker')
const foo = require('date-fns')
// debugger
const { isPast, isFuture, setMonth, getYear, getMonth, format, getDaysInMonth } = require('date-fns')
const button = require('datdot-ui-button')
// widgets
const calendarDays = require('datdot-ui-calendar-days')
const calendarMonth = require('datdot-ui-calendar-month')

var id = 0

module.exports = datepicker

function datepicker (opts, parent_wire) {
	
	const { name = 'datepicker', first, second, status = 'cleared' } = opts
  let name1 = 'calendar1'
  let name2 = 'calendar2'
	const current_state = {
		first: { pos: first.pos, value: null },
		second:	{ pos: second.pos, value: null }
	}
  
  // -----------------------------------
  const initial_contacts = { 'parent': parent_wire }
  const contacts = protocol_maker('input-number', listen, initial_contacts)
  
  function listen (msg) {
    const { head, refs, type, data, meta } = msg // receive msg
    const [from] = head
    const name = contacts.by_address[from].name
    console.log('DATEPICKER', { type, from, name, msg, data })
		if (type === 'click') handle_click(name, data.name)
    if (type === 'value-first' || type === 'value-second') return store_val(from, type, data)
    if (type === 'clear-other') return clearOther(contacts.by_address[from].name === name1 ? name2 : name1)
    // if (type !== 'ack' && type !== 'ready') return forwardMessage({ from, type })
	}

  // elements	
  let cal1 = calendarDays({name: name1, month: first.pos, days: first.days, year: first.year, status }, contacts.add(name1))
  let cal2 = calendarDays({name: name2, month: second.pos	, days: second.days, year: second.year, status }, contacts.add(name2))
  const weekList= ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday']
  const month1 = calendarMonth({ pos: first.pos }, contacts.add(`cal-month-1`))
  const month2 = calendarMonth({ pos: second.pos }, contacts.add(`cal-month-2`))

  const container = bel`<div class=${css['calendar-container']}></div>`

  container.append( calendarView(month1, cal1), calendarView(month2, cal2) )

  return bel`<div class=${css.datepicker}> <div class=${css["calendar-header"]}></div> ${container} </div>`

  function calendarView (title, calendar) { return  bel`<div class=${css.calendar}>${title}${makeWeekDays()}${calendar}</div>` }

  function makeWeekDays () {
      const el = bel`<section class=${css['calendar-weekday']} role="weekday"></section>`
      weekList.map( w => {
          let div = bel`<div class=${css['calendar-week']} role="week">${w.slice(0 ,1)}</div>`
          el.append(div)
      })
      return el
  }

  //////

	function handle_click (name, target) {
		const $name1 = contacts.by_name['calendar1']
		const $name2 = contacts.by_name['calendar2']
		const $month1 = contacts.by_name['cal-month-1']
		const $month2 = contacts.by_name['cal-month-2']
		let new_pos
		if (name === 'cal-month-1') {
			if (target === 'prev') new_pos = current_state.first.pos - 1
			else if (target === 'next') new_pos = current_state.first.pos + 1
			if ((current_state.second.pos - current_state.first.pos) === 1 && new_pos > current_state.first.pos) return
			current_state.first.pos = new_pos
			$month1.notify($month1.make({ to: $month1.address, type: 'update', data : { current: new_pos } }))
			$name1.notify($name1.make({ to: $name1.address, type: 'change', data: { current: new_pos } }))
		} else if (name === 'cal-month-2') {
			if (target === 'prev') new_pos = current_state.second.pos - 1
			else if (target === 'next') new_pos = current_state.second.pos + 1
			if ((current_state.second.pos - current_state.first.pos) === 1 && new_pos < current_state.second.pos) return
			current_state.second.pos = new_pos
			$month2.notify($month2.make({ to: $month2.address, type: 'update', data : { current: new_pos } }))
			$name2.notify($name2.make({ to: $name2.address, type: 'change', data: { current: new_pos } }))
		}
	}

  function clearOther (name) {
      const $name = contacts.by_name[name]
      $name.notify($name.make({ to: $name.address, type: 'clear' }))
  }


  function store_val (from, type, data) {
    const $parent = contacts.by_name['parent']
    const name = contacts.by_address[from].name
    if (type === 'value-first') {
      current_state.first.value = data.body
      type = (name === 'calendar1') ? 'first-selected-by-startcal' : 'first-selected-by-endcal' 
    } else if (type === 'value-second') {
      current_state.second.value = data.body
      type = 'second-selected' 
      $parent.notify($parent.make({ to: $parent.address, type: 'selection', data: { first: current_state.first.value, second: current_state.second.value } } ))
    }
    let other_name = (name === 'calendar1') ? 'calendar2' : 'calendar1'
    const $other = contacts.by_name[other_name]
    $other.notify($other.make({ to: $other.address, type, date: { data } } ))
    console.log('Notifying other', { $other, type })
  }

}

const css = csjs`
.datepicker {
    position: relative;
    max-width: 510px;
}
.datepicker-body {
    display: grid;
    grid-template-rows: auto;
    grid-template-columns: repeat(2, 210px);
    grid-gap: 35px;
}
.btn {
    background: none;
    border: none;
    border-radius: 50px;
    width: 30px;
    height: 30px;
    padding: 0;
    transition: background-color 0.3s ease-in-out;
    cursor: pointer;
}
.btn:active, .btn:hover {
    background-color: #C9C9C9;
}
.prev {}
.next {}
.icon svg path {
    transition: stroke 0.25s ease-in-out;
}
.icon-prev {}
.icon-next {}
.calendar-header {
    position: absolute;
    z-index: 9;
    display: flex;
    justify-content: space-between;
    width: 100%;
}
.calendar-container {
    display: flex;
}
.calendar-weekday {
    display: grid;
    grid-template-rows: 30px;
    grid-template-columns: repeat(7, minmax(30px, auto));
    justify-items: center;
    font-size: 12px;
}
.calendar-week {
    
}
.calendar {
    margin-left: 30px;
}
.title {
    font-size: 18px;
    text-align: center;
}
`