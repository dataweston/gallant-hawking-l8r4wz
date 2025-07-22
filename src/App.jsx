import React, { useState, useEffect } from 'react';
import { Calendar, Plus, DollarSign, TrendingUp, ShoppingCart, Edit3, Save, X, ChevronLeft, ChevronRight, Trash2 } from 'lucide-react';

const CateringSalesApp = () => {
  const [events, setEvents] = useState([]);
  const [receipts, setReceipts] = useState([]);
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [showEventModal, setShowEventModal] = useState(false);
  const [showReceiptModal, setShowReceiptModal] = useState(false);
  const [editingEvent, setEditingEvent] = useState(null);
  const [activeView, setActiveView] = useState('calendar');
  const [calendarView, setCalendarView] = useState('monthly'); // monthly, 3month, annual
  const [selectedMonthForSpending, setSelectedMonthForSpending] = useState(new Date());
  
  // Sample data initialization
  useEffect(() => {
    const sampleEvents = [
      {
        id: 1,
        title: "Corporate Lunch - TechCorp",
        date: new Date(2025, 6, 25), // July 25, 2025
        estimatedRevenue: 2500,
        estimatedFoodCost: 600,
        estimatedLaborCost: 400,
        actualRevenue: 0,
        actualFoodCost: 0,
        actualLaborCost: 0,
        status: 'confirmed',
        notes: "50 people, dietary restrictions: 5 vegetarian, 2 gluten-free",
        lists: ["Appetizers", "Main course", "Desserts", "Beverages"]
      },
      {
        id: 2,
        title: "Wedding Reception - Johnson",
        date: new Date(2025, 7, 15), // August 15, 2025
        estimatedRevenue: 8500,
        estimatedFoodCost: 2400,
        estimatedLaborCost: 1000,
        actualRevenue: 0,
        actualFoodCost: 0,
        actualLaborCost: 0,
        status: 'confirmed',
        notes: "150 guests, outdoor venue, backup indoor plan needed",
        lists: ["Cocktail hour menu", "Dinner service", "Late night snacks", "Bar service"]
      }
    ];
    setEvents(sampleEvents);

    const sampleReceipts = [
      {
        id: 1,
        store: "Whole Foods Market",
        total: 245.67,
        date: new Date(2025, 6, 20) // July 20, 2025
      },
      {
        id: 2,
        store: "Restaurant Depot",
        total: 189.43,
        date: new Date(2025, 6, 22) // July 22, 2025
      }
    ];
    setReceipts(sampleReceipts);
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
    // Feature: Added state for repetition
    repeat: 'none', // 'none', 'weekly', 'biweekly', 'monthly'
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
      event.date.
