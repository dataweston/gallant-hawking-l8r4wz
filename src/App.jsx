import React, { useState, useEffect } from 'react';
import { Calendar, Plus, DollarSign, TrendingUp, ShoppingCart, Edit3, Save, X, ChevronLeft, ChevronRight, Trash2 } from 'lucide-react';

// Import firestore functions and the db instance we created
import { db } from './firebase';
import { collection, onSnapshot, addDoc, updateDoc, deleteDoc, doc } from 'firebase/firestore';


const CateringSalesApp = () => {
  // The state will now start empty and be populated from Firestore
  const [events, setEvents] = useState([]);
  const [receipts, setReceipts] = useState([]);
  
  // All other state remains the same
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [showEventModal, setShowEventModal] = useState(false);
  const [showReceiptModal, setShowReceiptModal] = useState(false);
  const [editingEvent, setEditingEvent] = useState(null);
  const [activeView, setActiveView] = useState('calendar');
  const [calendarView, setCalendarView] = useState('monthly'); // monthly, 3month, annual
  const [selectedMonthForSpending, setSelectedMonthForSpending] = useState(new Date());

  // --- DATA FETCHING from FIRESTORE ---
  // This useEffect will listen for real-time updates from the 'events' collection
  useEffect(() => {
    const unsubscribe = onSnapshot(collection(db, 'events'), (snapshot) => {
      const eventsData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        // Convert Firestore Timestamp to JavaScript Date object
        date: doc.data().date.toDate(),
        repeatUntil: doc.data().repeatUntil ? doc.data().repeatUntil.toDate() : new Date()
      }));
      setEvents(eventsData);
    });
    // Cleanup function to unsubscribe from the listener when the component unmounts
    return () => unsubscribe();
  }, []); // Empty dependency array means this runs once on mount

  // Listener for the 'receipts' collection
  useEffect(() => {
    const unsubscribe = onSnapshot(collection(db, 'receipts'), (snapshot) => {
      const receiptsData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        date: doc.data().date.toDate(),
      }));
      setReceipts(receiptsData);
    });
    return () => unsubscribe();
  }, []);

  const [newEvent, setNewEvent] = useState({
    title: '',
    date: new Date(),
    estimatedRevenue: '',
    estimatedFoodCost: '',
    estimatedLaborCost: '',
    status: 'pending',
    notes: '',
    lists: [],
    repeat: 'none',
    repeatUntil: new Date()
  });

  const [newReceipt, setNewReceipt] = useState({
    store: '',
    total: '',
    date: new Date()
  });

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount);
  };

  const getCurrentYearData = () => {
    const currentYear = new Date().getFullYear();
    const today = new Date();
    const currentYearEvents = events.filter(event => 
      event.date.getFullYear() === currentYear && event.date >= today
    );
    
    const totalFutureRevenue = currentYearEvents.reduce((sum, event) => 
      sum + (event.actualRevenue || event.estimatedRevenue), 0
    );
    
    const totalFutureFoodCost = currentYearEvents.reduce((sum, event) => 
      sum + (event.actualFoodCost || event.estimatedFoodCost), 0
    );

    const totalFutureLaborCost = currentYearEvents.reduce((sum, event) => 
      sum + (event.actualLaborCost || event.estimatedLaborCost), 0
    );

    return { totalFutureRevenue, totalFutureFoodCost, totalFutureLaborCost };
  };

  const getMonthlyFoodSpending = (month = selectedMonthForSpending) => {
    const targetMonth = month.getMonth();
    const targetYear = month.getFullYear();
    
    return receipts
      .filter(receipt => 
        receipt.date.getMonth() === targetMonth && 
        receipt.date.getFullYear() === targetYear
      )
      .reduce((sum, receipt) => sum + receipt.total, 0);
  };

  // --- DATA MODIFICATION with FIRESTORE ---
  const handleSaveEvent = async () => {
    // The function is now async to wait for the database operation
    const eventData = {
        ...newEvent,
        estimatedRevenue: parseFloat(newEvent.estimatedRevenue) || 0,
        estimatedFoodCost: parseFloat(newEvent.estimatedFoodCost) || 0,
        estimatedLaborCost: parseFloat(newEvent.estimatedLaborCost) || 0,
        // Ensure other fields that might not be set are given default values
        actualRevenue: newEvent.actualRevenue || 0,
        actualFoodCost: newEvent.actualFoodCost || 0,
        actualLaborCost: newEvent.actualLaborCost || 0,
    };
    
    if (editingEvent) {
      // Update an existing document
      const eventDoc = doc(db, 'events', editingEvent.id);
      await updateDoc(eventDoc, eventData);
      setEditingEvent(null);
    } else {
      // Add a new document
      await addDoc(collection(db, 'events'), eventData);
      // NOTE: Repetition logic is not implemented for Firestore in this example.
      // You would need to loop and call addDoc multiple times if you want to restore that feature.
    }

    // We no longer need to call setEvents manually! `onSnapshot` handles it.
    setShowEventModal(false);
    // Reset form
    setNewEvent({
      title: '', date: new Date(), estimatedRevenue: '', estimatedFoodCost: '',
      estimatedLaborCost: '', status: 'pending', notes: '', lists: [],
      repeat: 'none', repeatUntil: new Date()
    });
  };
  
  const handleDeleteEvent = async (eventId) => {
    if (window.confirm('Are you sure you want to delete this event?')) {
      const eventDoc = doc(db, 'events', eventId);
      await deleteDoc(eventDoc);
      // UI updates automatically via onSnapshot
      setShowEventModal(false);
      setEditingEvent(null);
    }
  };

  const handleSaveReceipt = async () => {
    const receiptData = {
      ...newReceipt,
      total: parseFloat(newReceipt.total) || 0,
      date: new Date(newReceipt.date),
    };
    await addDoc(collection(db, 'receipts'), receiptData);
    setShowReceiptModal(false);
    setNewReceipt({ store: '', total: '', date: new Date() });
  };
  
  const openEditModal = (event) => {
    setEditingEvent(event);
    setNewEvent({
      ...event,
      date: event.date, // Already a Date object
      estimatedRevenue: event.estimatedRevenue.toString(),
      estimatedFoodCost: event.estimatedFoodCost.toString(),
      estimatedLaborCost: event.estimatedLaborCost.toString(),
    });
    setShowEventModal(true);
  };

  // --- ALL RENDER FUNCTIONS & JSX REMAIN UNCHANGED ---

  const renderCalendar = () => {
    const today = new Date();
    const currentMonth = selectedDate.getMonth();
    const currentYear = selectedDate.getFullYear();
    
    const firstDay = new Date(currentYear, currentMonth, 1);
    const lastDay = new Date(currentYear, currentMonth + 1, 0);
    const startDate = new Date(firstDay);
    startDate.setDate(startDate.getDate() - firstDay.getDay());
    
    const days = [];
    const currentDate = new Date(startDate);
    
    for (let i = 0; i < 42; i++) {
      const dayEvents = events.filter(event => 
        event.date.toDateString() === currentDate.toDateString()
      );
      
      days.push({
        date: new Date(currentDate),
        isCurrentMonth: currentDate.getMonth() === currentMonth,
        isToday: currentDate.toDateString() === today.toDateString(),
        events: dayEvents
      });
      
      currentDate.setDate(currentDate.getDate() + 1);
    }

    return (
      <div className="bg-white rounded-lg shadow-sm border border-gray-200">
        <div className="p-4 border-b border-gray-200 flex items-center justify-between">
          <h2 className="text-lg font-semibold text-gray-900">
            {selectedDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
          </h2>
          <div className="flex items-center space-x-2">
            <button
              onClick={() => setSelectedDate(new Date(selectedDate.getFullYear(), selectedDate.getMonth() - 1))}
              className="p-1 hover:bg-gray-100 rounded"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>
            <button
              onClick={() => setSelectedDate(new Date())}
              className="px-3 py-1 text-sm bg-blue-100 text-blue-700 rounded hover:bg-blue-200"
            >
              Today
            </button>
            <button
              onClick={() => setSelectedDate(new Date(selectedDate.getFullYear(), selectedDate.getMonth() + 1))}
              className="p-1 hover:bg-gray-100 rounded"
            >
              <ChevronRight className="w-5 h-5" />
            </button>
          </div>
        </div>
        
        <div className="grid grid-cols-7 gap-0 text-sm">
          {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
            <div key={day} className="p-3 text-center font-medium text-gray-500 border-b border-gray-100">
              {day}
            </div>
          ))}
          
          {days.map((day, index) => (
            <div
              key={index}
              className={`min-h-24 p-2 border-b border-r border-gray-100 ${
                !day.isCurrentMonth ? 'bg-gray-50' : 'bg-white hover:bg-gray-50'
              } ${day.isToday ? 'bg-blue-50' : ''}`}
            >
              <div className={`text-sm ${
                !day.isCurrentMonth ? 'text-gray-400' : 
                day.isToday ? 'text-blue-700 font-semibold' : 'text-gray-900'
              }`}>
                {day.date.getDate()}
              </div>
              {day.events.map(event => (
                <div
                  key={event.id}
                  onClick={() => openEditModal(event)}
                  className={`mt-1 p-1 text-xs rounded cursor-pointer truncate ${
                    event.status === 'confirmed' ? 'bg-green-100 text-green-800' :
                    event.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                    'bg-gray-100 text-gray-800'
                  }`}
                >
                  {event.title}
                </div>
              ))}
            </div>
          ))}
        </div>
      </div>
    );
  };

  const renderThreeMonthView = () => {
    const months = [];
    for (let i = -1; i <= 1; i++) {
      const monthDate = new Date(selectedDate.getFullYear(), selectedDate.getMonth() + i, 1);
      months.push(monthDate);
    }

    return (
      <div className="bg-white rounded-lg shadow-sm border border-gray-200">
        <div className="p-4 border-b border-gray-200 flex items-center justify-between">
          <h2 className="text-lg font-semibold text-gray-900">3 Month View</h2>
          <div className="flex items-center space-x-2">
            <button
              onClick={() => setSelectedDate(new Date(selectedDate.getFullYear(), selectedDate.getMonth() - 3))}
              className="p-1 hover:bg-gray-100 rounded"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>
            <button
              onClick={() => setSelectedDate(new Date())}
              className="px-3 py-1 text-sm bg-blue-100 text-blue-700 rounded hover:bg-blue-200"
            >
              Today
            </button>
            <button
              onClick={() => setSelectedDate(new Date(selectedDate.getFullYear(), selectedDate.getMonth() + 3))}
              className="p-1 hover:bg-gray-100 rounded"
            >
              <ChevronRight className="w-5 h-5" />
            </button>
          </div>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 p-4">
          {months.map((month, index) => (
            <div key={index} className="border border-gray-200 rounded">
              <div className="p-2 bg-gray-50 font-medium text-sm text-center">
                {month.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
              </div>
              <div className="p-2">
                {events
                  .filter(event => 
                    event.date.getMonth() === month.getMonth() && 
                    event.date.getFullYear() === month.getFullYear()
                  )
                  .map(event => (
                    <div
                      key={event.id}
                      onClick={() => openEditModal(event)}
                      className={`mb-1 p-2 text-xs rounded cursor-pointer ${
                        event.status === 'confirmed' ? 'bg-green-100 text-green-800' :
                        event.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                        'bg-gray-100 text-gray-800'
                      }`}
                    >
                      <div className="font-medium">{event.title}</div>
                      <div>{event.date.getDate()}</div>
                    </div>
                  ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  };

  const renderAnnualView = () => {
    const year = selectedDate.getFullYear();
    const months = [];
    for (let i = 0; i < 12; i++) {
      months.push(new Date(year, i, 1));
    }

    return (
      <div className="bg-white rounded-lg shadow-sm border border-gray-200">
        <div className="p-4 border-b border-gray-200 flex items-center justify-between">
          <h2 className="text-lg font-semibold text-gray-900">{year} Annual View</h2>
          <div className="flex items-center space-x-2">
            <button
              onClick={() => setSelectedDate(new Date(year - 1, selectedDate.getMonth()))}
              className="p-1 hover:bg-gray-100 rounded"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>
            <button
              onClick={() => setSelectedDate(new Date())}
              className="px-3 py-1 text-sm bg-blue-100 text-blue-700 rounded hover:bg-blue-200"
            >
              Current Year
            </button>
            <button
              onClick={() => setSelectedDate(new Date(year + 1, selectedDate.getMonth()))}
              className="p-1 hover:bg-gray-100 rounded"
            >
              <ChevronRight className="w-5 h-5" />
            </button>
          </div>
        </div>
        
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 p-4">
          {months.map((month, index) => (
            <div key={index} className="border border-gray-200 rounded">
              <div className="p-2 bg-gray-50 font-medium text-sm text-center">
                {month.toLocaleDateString('en-US', { month: 'long' })}
              </div>
              <div className="p-2">
                {events
                  .filter(event => 
                    event.date.getMonth() === month.getMonth() && 
                    event.date.getFullYear() === month.getFullYear()
                  )
                  .map(event => (
                    <div
                      key={event.id}
                      onClick={() => openEditModal(event)}
                      className={`mb-1 p-1 text-xs rounded cursor-pointer ${
                        event.status === 'confirmed' ? 'bg-green-100 text-green-800' :
                        event.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                        'bg-gray-100 text-gray-800'
                      }`}
                    >
                      <div className="font-medium truncate">{event.title}</div>
                      <div>{event.date.getDate()}</div>
                    </div>
                  ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  };

  const renderFinancials = () => {
    const { totalFutureRevenue, totalFutureFoodCost, totalFutureLaborCost } = getCurrentYearData();
    const monthlySpending = getMonthlyFoodSpending();
    const totalFutureCOGS = totalFutureFoodCost + totalFutureLaborCost;
    const grossMargin = totalFutureRevenue - totalFutureCOGS;
    
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Future Revenue (This Year)</p>
                <p className="text-2xl font-semibold text-green-600">
                  {formatCurrency(totalFutureRevenue)}
                </p>
              </div>
              <TrendingUp className="w-8 h-8 text-green-500" />
            </div>
          </div>
          
          <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Future Food Costs</p>
                <p className="text-2xl font-semibold text-red-600">
                  {formatCurrency(totalFutureFoodCost)}
                </p>
              </div>
              <ShoppingCart className="w-8 h-8 text-red-500" />
            </div>
          </div>
          
          <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Future Labor Costs</p>
                <p className="text-2xl font-semibold text-orange-600">
                  {formatCurrency(totalFutureLaborCost)}
                </p>
              </div>
              <DollarSign className="w-8 h-8 text-orange-500" />
            </div>
          </div>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Future Gross Margin</p>
                <p className="text-2xl font-semibold text-blue-600">
                  {formatCurrency(grossMargin)}
                </p>
              </div>
              <TrendingUp className="w-8 h-8 text-blue-500" />
            </div>
          </div>
          
          <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
            <div className="flex items-center justify-between mb-4">
              <div>
                <p className="text-sm text-gray-600">Monthly Food Spending</p>
                <p className="text-2xl font-semibold text-gray-900">
                  {formatCurrency(monthlySpending)}
                </p>
              </div>
              <ShoppingCart className="w-8 h-8 text-gray-500" />
            </div>
            <div className="flex items-center space-x-2">
              <button
                onClick={() => setSelectedMonthForSpending(new Date(selectedMonthForSpending.getFullYear(), selectedMonthForSpending.getMonth() - 1))}
                className="p-1 hover:bg-gray-100 rounded"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <span className="text-sm font-medium text-gray-700 min-w-24 text-center">
                {selectedMonthForSpending.toLocaleDateString('en-US', { month: 'short', year: 'numeric' })}
              </span>
              <button
                onClick={() => setSelectedMonthForSpending(new Date(selectedMonthForSpending.getFullYear(), selectedMonthForSpending.getMonth() + 1))}
                className="p-1 hover:bg-gray-100 rounded"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-gray-200">
          <div className="p-4 border-b border-gray-200">
            <h3 className="text-lg font-semibold">Monthly Receipts</h3>
            <div className="flex items-center space-x-2 mt-2">
              <button
                onClick={() => setSelectedMonthForSpending(new Date(selectedMonthForSpending.getFullYear(), selectedMonthForSpending.getMonth() - 1))}
                className="p-1 hover:bg-gray-100 rounded"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <span className="text-sm font-medium text-gray-700 min-w-24 text-center">
                {selectedMonthForSpending.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
              </span>
              <button
                onClick={() => setSelectedMonthForSpending(new Date(selectedMonthForSpending.getFullYear(), selectedMonthForSpending.getMonth() + 1))}
                className="p-1 hover:bg-gray-100 rounded"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
          <div className="p-4">
            {receipts
              .filter(receipt => 
                receipt.date.getMonth() === selectedMonthForSpending.getMonth() && 
                receipt.date.getFullYear() === selectedMonthForSpending.getFullYear()
              )
              .sort((a, b) => b.date - a.date)
              .map(receipt => (
                <div 
                  key={receipt.id} 
                  className="flex justify-between items-center py-3 border-b border-gray-100 last:border-b-0"
                >
                  <div>
                    <p className="font-medium text-gray-900">{receipt.store}</p>
                    <p className="text-sm text-gray-600">
                      {receipt.date.toLocaleDateString('en-US', { 
                        weekday: 'short', 
                        month: 'short', 
                        day: 'numeric' 
                      })}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="font-medium text-red-600">
                      {formatCurrency(receipt.total)}
                    </p>
                  </div>
                </div>
              ))}
            {receipts.filter(receipt => 
              receipt.date.getMonth() === selectedMonthForSpending.getMonth() && 
              receipt.date.getFullYear() === selectedMonthForSpending.getFullYear()
            ).length === 0 && (
              <p className="text-gray-500 text-center py-4">No receipts for this month</p>
            )}
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-gray-200">
          <div className="p-4 border-b border-gray-200">
            <h3 className="text-lg font-semibold">Upcoming Events</h3>
          </div>
          <div className="p-4">
            {events
              .filter(event => event.date >= new Date())
              .sort((a, b) => a.date - b.date)
              .slice(0, 5)
              .map(event => (
                <div 
                  key={event.id} 
                  className="flex justify-between items-center py-3 border-b border-gray-100 last:border-b-0 cursor-pointer hover:bg-gray-50 rounded px-2"
                  onClick={() => openEditModal(event)}
                >
                  <div>
                    <p className="font-medium text-gray-900">{event.title}</p>
                    <p className="text-sm text-gray-600">
                      {event.date.toLocaleDateString('en-US', { 
                        weekday: 'short', 
                        month: 'short', 
                        day: 'numeric' 
                      })}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="font-medium text-green-600">
                      {formatCurrency(event.estimatedRevenue)}
                    </p>
                    <p className="text-sm text-gray-600">
                      Food: {formatCurrency(event.estimatedFoodCost)} | Labor: {formatCurrency(event.estimatedLaborCost)}
                    </p>
                  </div>
                </div>
              ))}
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex justify-between items-center">
            <h1 className="text-2xl font-bold text-gray-900">Local Effort Calendar and Budget</h1>
            <div className="flex items-center space-x-3">
              <button
                onClick={() => setShowReceiptModal(true)}
                className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg flex items-center space-x-2 transition-colors"
              >
                <Plus className="w-4 h-4" />
                <span>New Receipt</span>
              </button>
              <button
                onClick={() => {
                  setEditingEvent(null);
                  setNewEvent({ title: '', date: new Date(), estimatedRevenue: '', estimatedFoodCost: '', estimatedLaborCost: '', status: 'pending', notes: '', lists: [], repeat: 'none', repeatUntil: new Date() });
                  setShowEventModal(true);
                }}
                className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg flex items-center space-x-2 transition-colors"
              >
                <Plus className="w-4 h-4" />
                <span>New Event</span>
              </button>
            </div>
          </div>
          
          <nav className="mt-4">
            <div className="flex justify-between">
              <div className="flex space-x-6">
                <button
                  onClick={() => setActiveView('calendar')}
                  className={`pb-2 border-b-2 font-medium text-sm transition-colors ${
                    activeView === 'calendar' 
                      ? 'border-blue-500 text-blue-600' 
                      : 'border-transparent text-gray-500 hover:text-gray-700'
                  }`}
                >
                  <Calendar className="w-4 h-4 inline mr-2" />
                  Calendar
                </button>
                <button
                  onClick={() => setActiveView('financials')}
                  className={`pb-2 border-b-2 font-medium text-sm transition-colors ${
                    activeView === 'financials' 
                      ? 'border-blue-500 text-blue-600' 
                      : 'border-transparent text-gray-500 hover:text-gray-700'
                  }`}
                >
                  <DollarSign className="w-4 h-4 inline mr-2" />
                  Financials
                </button>
              </div>
              
              {activeView === 'calendar' && (
                <div className="flex items-center space-x-2">
                  <button
                    onClick={() => setCalendarView('monthly')}
                    className={`px-3 py-1 text-sm rounded transition-colors ${
                      calendarView === 'monthly' 
                        ? 'bg-blue-100 text-blue-700' 
                        : 'text-gray-500 hover:text-gray-700'
                    }`}
                  >
                    Monthly
                  </button>
                  <button
                    onClick={() => setCalendarView('3month')}
                    className={`px-3 py-1 text-sm rounded transition-colors ${
                      calendarView === '3month' 
                        ? 'bg-blue-100 text-blue-700' 
                        : 'text-gray-500 hover:text-gray-700'
                    }`}
                  >
                    3 Month
                  </button>
                  <button
                    onClick={() => setCalendarView('annual')}
                    className={`px-3 py-1 text-sm rounded transition-colors ${
                      calendarView === 'annual' 
                        ? 'bg-blue-100 text-blue-700' 
                        : 'text-gray-500 hover:text-gray-700'
                    }`}
                  >
                    Annual
                  </button>
                </div>
              )}
            </div>
          </nav>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-8">
        {activeView === 'calendar' ? (
          calendarView === 'monthly' ? renderCalendar() :
          calendarView === '3month' ? renderThreeMonthView() :
          renderAnnualView()
        ) : renderFinancials()}
      </main>

      {/* Event Modal */}
      {showEventModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full max-h-screen overflow-y-auto">
            <div className="p-6">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-semibold">
                  {editingEvent ? 'Edit Event' : 'New Event'}
                </h3>
                <button
                  onClick={() => {
                    setShowEventModal(false);
                    setEditingEvent(null);
                  }}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Event Title
                  </label>
                  <input
                    type="text"
                    value={newEvent.title}
                    onChange={(e) => setNewEvent({...newEvent, title: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="Enter event title"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Date
                  </label>
                  <input
                    type="date"
                    value={newEvent.date.toISOString().split('T')[0]}
                    onChange={(e) => setNewEvent({...newEvent, date: new Date(e.target.value)})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Estimated Revenue
                  </label>
                  <input
                    type="number"
                    value={newEvent.estimatedRevenue}
                    onChange={(e) => setNewEvent({...newEvent, estimatedRevenue: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="0.00"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Estimated Food Cost
                    </label>
                    <input
                      type="number"
                      value={newEvent.estimatedFoodCost}
                      onChange={(e) => setNewEvent({...newEvent, estimatedFoodCost: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      placeholder="0.00"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Estimated Labor Cost
                    </label>
                    <input
                      type="number"
                      value={newEvent.estimatedLaborCost}
                      onChange={(e) => setNewEvent({...newEvent, estimatedLaborCost: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      placeholder="0.00"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Status
                  </label>
                  <select
                    value={newEvent.status}
                    onChange={(e) => setNewEvent({...newEvent, status: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value="pending">Pending</option>
                    <option value="confirmed">Confirmed</option>
                    <option value="completed">Completed</option>
                    <option value="cancelled">Cancelled</option>
                  </select>
                </div>
                
                {!editingEvent && (
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Repeat
                      </label>
                      <select
                        value={newEvent.repeat}
                        onChange={(e) => setNewEvent({ ...newEvent, repeat: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      >
                        <option value="none">None</option>
                        <option value="weekly">Weekly</option>
                        <option value="biweekly">Bi-weekly</option>
                        <option value="monthly">Monthly</option>
                      </select>
                    </div>
                    {newEvent.repeat !== 'none' && (
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Repeat Until
                        </label>
                        <input
                          type="date"
                          value={newEvent.repeatUntil.toISOString().split('T')[0]}
                          onChange={(e) => setNewEvent({ ...newEvent, repeatUntil: new Date(e.target.value) })}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        />
                      </div>
                    )}
                  </div>
                )}

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Notes
                  </label>
                  <textarea
                    value={newEvent.notes}
                    onChange={(e) => setNewEvent({...newEvent, notes: e.target.value})}
                    rows="3"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="Add any notes about this event..."
                  />
                </div>
              </div>

              <div className="mt-6 flex justify-between">
                <div>
                  {editingEvent && (
                    <button
                      onClick={() => handleDeleteEvent(editingEvent.id)}
                      className="px-4 py-2 text-sm font-medium text-white bg-red-600 hover:bg-red-700 rounded-md transition-colors flex items-center"
                    >
                      <Trash2 className="w-4 h-4 inline mr-2" />
                      Delete Event
                    </button>
                  )}
                </div>
                <div className="flex space-x-3">
                  <button
                    onClick={() => {
                      setShowEventModal(false);
                      setEditingEvent(null);
                    }}
                    className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-md transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleSaveEvent}
                    className="px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-md transition-colors"
                  >
                    <Save className="w-4 h-4 inline mr-2" />
                    Save Event
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Receipt Modal */}
      {showReceiptModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full">
            <div className="p-6">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-semibold">New Receipt</h3>
                <button
                  onClick={() => {
                    setShowReceiptModal(false);
                  }}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Store
                  </label>
                  <input
                    type="text"
                    value={newReceipt.store}
                    onChange={(e) => setNewReceipt({...newReceipt, store: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-green-500 focus:border-green-500"
                    placeholder="Enter store name"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Total
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    value={newReceipt.total}
                    onChange={(e) => setNewReceipt({...newReceipt, total: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-green-500 focus:border-green-500"
                    placeholder="0.00"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Date
                  </label>
                  <input
                    type="date"
                    value={newReceipt.date.toISOString().split('T')[0]}
                    onChange={(e) => setNewReceipt({...newReceipt, date: new Date(e.target.value)})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-green-500 focus:border-green-500"
                  />
                </div>
              </div>

              <div className="mt-6 flex justify-end space-x-3">
                <button
                  onClick={() => {
                    setShowReceiptModal(false);
                  }}
                  className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-md transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSaveReceipt}
                  className="px-4 py-2 text-sm font-medium text-white bg-green-600 hover:bg-green-700 rounded-md transition-colors"
                >
                  <Save className="w-4 h-4 inline mr-2" />
                  Save Receipt
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CateringSalesApp;
