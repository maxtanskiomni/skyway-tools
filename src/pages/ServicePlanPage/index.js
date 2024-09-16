import React, { useRef, useEffect, useState } from 'react';
import { Calendar } from '@fullcalendar/core';
import dayGridPlugin from '@fullcalendar/daygrid';
import interactionPlugin from '@fullcalendar/interaction'; // For drag-n-drop
import timeGridPlugin from '@fullcalendar/timegrid'; // For resizing
import { Container, Paper, Dialog, DialogActions, DialogContent, DialogTitle, Button, TextField, FormControl, InputLabel, MenuItem, Select } from '@mui/material';
import firebase from '../../utilities/firebase.js';
import { StateManager } from '../../utilities/stateManager'; // Importing StateManager
import constants from '../../utilities/constants';
import moment from 'moment';

const db = firebase.firestore();
const mechs = constants.mechanics.sort((a, b) => a.name.localeCompare(b.name));
const mechIds = constants.mechanics.map(mech => mech.id);

const CalendarPage = () => {
  const calendarRef = useRef(null);
  const [calendar, setCalendar] = useState(null);
  const [open, setOpen] = useState(false);
  const [newEventTitle, setNewEventTitle] = useState('');
  const [selectedDate, setSelectedDate] = useState(null);
  const [selectedCalendar, setSelectedCalendar] = useState("master"); // Track the selected calendar
  const [events, setEvents] = useState([]);
  const [allEvents, setAllEvents] = useState([]); // Track all fetched events

  useEffect(() => {
    const cal = new Calendar(calendarRef.current, {
      plugins: [dayGridPlugin, interactionPlugin, timeGridPlugin],
      initialView: 'dayGridMonth',
      headerToolbar: {
        left: 'prev,next today',
        center: 'title',
        right: 'dayGridMonth,timeGridWeek,timeGridDay'
      },
      editable: true, // Allows events to be dragged and resized
      selectable: true, // Allows clicking to select dates
      events: events,
      eventDrop: (info) => {
        handleEventUpdate(info.event);
      },
      eventResize: (info) => {
        handleEventUpdate(info.event);
      },
      dateClick: (info) => {
        setSelectedDate(info.dateStr);
        if(selectedCalendar !== "master") setOpen(true);
      },
      eventClick: (info) => {
        if (window.confirm(`Are you sure you want to delete the event '${info.event.title}'?`)) {
          handleEventRemove(info.event);
          info.event.remove();
        }
      }
    });
    cal.render();
    setCalendar(cal);
  }, [events]);

  useEffect(() => {
    fetchEvents();
  }, []);

  useEffect(() => {
    if (selectedCalendar) {
      filterEventsByCalendar();
    }
  }, [selectedCalendar, allEvents]);

  // Fetch all events from Firebase
  const fetchEvents = async () => {
    try {
      StateManager.setLoading(true); // Show loading state
      const now = moment();
      const start = now.clone().subtract(6, 'months').startOf('month');
      const end = now.clone().add(6, 'months').endOf('month');

      const snapshot = await db.collection('service-events')
        .where('start', '>=', start.format("YYYY-MM-DD"))
        .where('start', '<=', end.format("YYYY-MM-DD"))
        .get();

      const fetchedEvents = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        start: doc.data().start,
        end: doc.data().end,
      }));

      setAllEvents(fetchedEvents);
      filterEventsByCalendar(fetchedEvents); // Initial filter
    } catch (error) {
      console.error('Error fetching events:', error);
    } finally {
      StateManager.setLoading(false); // Hide loading state
    }
  };

  // Filter events based on the selected calendar
  const filterEventsByCalendar = (eventsToFilter = allEvents) => {
    const filteredEvents = eventsToFilter
      .filter(event => selectedCalendar === "master" || event.calendar === selectedCalendar)
      .map(event => {
        event.color = colors.at(mechIds.indexOf(event.calendar));
        return event
      });
    console.log(filteredEvents)

    setEvents(filteredEvents);
  };

  const handleCalendarChange = (event) => {
    const selected = event.target.value;
    setSelectedCalendar(selected);
    console.log(`Selected calendar: ${selected}`);
  };

  const handleAddEvent = async () => {
    if (newEventTitle) {
      const newEvent = {
        title: newEventTitle,
        start: selectedDate,
        end: selectedDate,
        calendar: selectedCalendar,
        allDay: true
      };

      try {
        const docRef = await db.collection('service-events').add(newEvent);
        setAllEvents([...allEvents, { id: docRef.id, ...newEvent }]);
        filterEventsByCalendar([...allEvents, { id: docRef.id, ...newEvent }]);
        calendar.addEvent({ id: docRef.id, ...newEvent });
      } catch (error) {
        console.error('Error adding event:', error);
      } finally {
        setOpen(false);
        setNewEventTitle('');
        setSelectedDate(null);
      }
    }
  };

  const handleEventUpdate = async (updatedEvent) => {
    try {
      await db.collection('service-events').doc(updatedEvent.id).update({
        start: moment(updatedEvent.start).format("YYYY-MM-DD"),
        end: moment(updatedEvent.end || updatedEvent.start).format("YYYY-MM-DD")
      });

      const updatedEvents = allEvents.map(event =>
        event.id === updatedEvent.id
          ? { ...event, start: updatedEvent.start, end: updatedEvent.end }
          : event
      );

      setAllEvents(updatedEvents);
      filterEventsByCalendar(updatedEvents);
    } catch (error) {
      console.error('Error updating event:', error);
    }
  };

  const handleEventRemove = async (eventToRemove) => {
    try {
      await db.collection('service-events').doc(eventToRemove.id).delete();
      const remainingEvents = allEvents.filter(event => event.id !== eventToRemove.id);
      setAllEvents(remainingEvents);
      filterEventsByCalendar(remainingEvents);
    } catch (error) {
      console.error('Error removing event:', error);
    }
  };

  const handleClose = () => {
    setOpen(false);
    setNewEventTitle('');
    setSelectedDate(null);
  };

  const handleKeyPress = (event) => {
    if (event.key === 'Enter') {
      handleAddEvent();
    } else if (event.key === 'Escape') {
      handleClose();
    }
  };

  return (
    <Container sx={{ marginTop: 4 }}>
      <Paper elevation={3} sx={{ padding: 2 }}>
        <FormControl fullWidth sx={{ marginBottom: 2 }}>
          <InputLabel id="calendar-select-label">Select Calendar</InputLabel>
          <Select
            labelId="calendar-select-label"
            value={selectedCalendar}
            label="Select Calendar"
            onChange={handleCalendarChange}
          >
            <MenuItem value="master">Master Calendar</MenuItem>
            {mechs.map(mech => (<MenuItem value={mech.id}>{mech.name}</MenuItem>))}
          </Select>
        </FormControl>

        <div ref={calendarRef}></div>
      </Paper>

      <Dialog open={open} onClose={handleClose}>
        <DialogTitle>Add New Event</DialogTitle>
        <DialogContent>
          <TextField
            autoFocus
            margin="dense"
            label="Event Title"
            fullWidth
            value={newEventTitle}
            onChange={(e) => setNewEventTitle(e.target.value)}
            onKeyDown={handleKeyPress} // Listen for key presses
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={handleClose} color="secondary">
            Cancel
          </Button>
          <Button onClick={handleAddEvent} color="primary">
            Add Event
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
};

export default CalendarPage;



const colors = [
  "#7A8E7B", // Deep Mint
  "#468D8B", // Deep Teal
  "#7F7BAA", // Deep Lavender
  "#A4566A", // Deep Rose
  "#CC9A63", // Deep Apricot
  "#6B7A8F", // Deep Blue Gray
  "#5D5A59", // Deep Warm Gray
  "#8A7D8F", // Deep Lilac
  "#6B7A8F", // Deep Blue Gray
  "#2E807A", // Deep Turquoise
  "#505A70", // Deep Slate Blue
  "#D98A4E", // Deep Peach
  "#6E8D6F", // Deep Sage
  "#C27174", // Deep Rose Pink
  "#A46C6A", // Deep Blush
  "#D95D4A", // Deep Coral
  "#BF7E6C", // Deep Salmon
  "#B89B64", // Deep Gold
  "#8A7564", // Deep Taupe
  "#BBA089", // Deep Sand
  "#7A985E"  // Deep Olive Green
];