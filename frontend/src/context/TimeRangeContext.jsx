import React, { createContext, useContext, useState, useCallback } from 'react';

const TimeRangeContext = createContext();

export const useTimeRange = () => {
  const context = useContext(TimeRangeContext);
  if (!context) {
    throw new Error('useTimeRange must be used within a TimeRangeProvider');
  }
  return context;
};

export const TimeRangeProvider = ({ children }) => {
  // Initialize with current year by default for meaningful analytics data
  const currentYear = new Date().getFullYear();
  const [dateRange, setDateRange] = useState({
    startDate: `${currentYear}-01-01`,
    endDate: new Date().toISOString().split('T')[0]
  });
  
  const [selectedPreset, setSelectedPreset] = useState('this_year');

  // Date presets matching the design from issue1.JPG
  const datePresets = {
    current_month: {
      label: 'Current month',
      months: 1,
      getRange: () => ({
        startDate: new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().split('T')[0],
        endDate: new Date().toISOString().split('T')[0]
      })
    },
    this_year: {
      label: 'This Year',
      months: 12,
      getRange: () => {
        const currentYear = new Date().getFullYear();
        return {
          startDate: `${currentYear}-01-01`,
          endDate: new Date().toISOString().split('T')[0]
        };
      }
    },
    '3_months': {
      label: '3 months',
      months: 3,
      getRange: () => {
        const endDate = new Date().toISOString().split('T')[0];
        const startDate = new Date();
        startDate.setMonth(startDate.getMonth() - 3);
        return {
          startDate: startDate.toISOString().split('T')[0],
          endDate
        };
      }
    },
    '6_months': {
      label: '6 months',
      months: 6,
      getRange: () => {
        const endDate = new Date().toISOString().split('T')[0];
        const startDate = new Date();
        startDate.setMonth(startDate.getMonth() - 6);
        return {
          startDate: startDate.toISOString().split('T')[0],
          endDate
        };
      }
    },
    '12_months': {
      label: '12 months',
      months: 12,
      getRange: () => {
        const endDate = new Date().toISOString().split('T')[0];
        const startDate = new Date();
        startDate.setMonth(startDate.getMonth() - 12);
        return {
          startDate: startDate.toISOString().split('T')[0],
          endDate
        };
      }
    },
    all_time: {
      label: 'All Time',
      months: null,
      getRange: () => ({
        startDate: '2000-01-01',
        endDate: new Date().toISOString().split('T')[0]
      })
    },
    custom: {
      label: 'Custom Range',
      months: null,
      getRange: () => dateRange // Return current range for custom
    }
  };

  // CRITICAL FIX: Enhanced preset change handler with immediate propagation
  const handlePresetChange = useCallback((preset, customRange = null) => {
    console.log(`🎯 TimeRangeContext: Preset changing to ${preset}`, customRange);
    setSelectedPreset(preset);
    
    if (preset === 'custom' && customRange) {
      console.log('📊 TimeRangeContext: Setting custom range:', customRange);
      setDateRange(customRange);
      console.log('🚀 TimeRangeContext: Custom range broadcasted to all listeners');
    } else if (datePresets[preset]) {
      const newRange = datePresets[preset].getRange();
      console.log(`📊 TimeRangeContext: Setting preset range for ${preset}:`, newRange);
      setDateRange(newRange);
      console.log('🚀 TimeRangeContext: Preset range broadcasted to all listeners');
    }
  }, [datePresets]);

  // CRITICAL FIX: Handle manual date range changes with immediate validation and propagation
  const handleDateRangeChange = useCallback((field, value) => {
    // Enhanced validation with proper error handling
    if (!value || value === 'Invalid Date' || value === '') {
      console.warn('TimeRangeContext: Invalid date value provided:', value);
      return;
    }
    
    console.log(`🔄 TimeRangeContext: ${field} changing from ${dateRange[field]} to ${value}`);
    
    setDateRange(prev => {
      const newRange = {
        ...prev,
        [field]: value
      };
      
      // Enhanced date validation with better logging
      if (field === 'startDate' && newRange.endDate) {
        const startDate = new Date(value);
        const endDate = new Date(newRange.endDate);
        if (startDate >= endDate) {
          console.warn('TimeRangeContext: Start date must be before end date');
          return prev; // Don't update if invalid
        }
      } else if (field === 'endDate' && newRange.startDate) {
        const startDate = new Date(newRange.startDate);
        const endDate = new Date(value);
        if (endDate <= startDate) {
          console.warn('TimeRangeContext: End date must be after start date');
          return prev; // Don't update if invalid
        }
      }
      
      console.log('📅 TimeRangeContext: New range successfully set:', newRange);
      console.log('🚀 TimeRangeContext: Broadcasting date change to all listeners');
      return newRange;
    });
    
    setSelectedPreset('custom');
  }, [dateRange]);

  // Update both range and preset
  const updateTimeRange = useCallback((newRange, preset = 'custom') => {
    setDateRange(newRange);
    setSelectedPreset(preset);
  }, []);

  const value = {
    // State
    dateRange,
    selectedPreset,
    datePresets,
    
    // Actions
    handlePresetChange,
    handleDateRangeChange,
    updateTimeRange,
    setDateRange,
    setSelectedPreset
  };

  return (
    <TimeRangeContext.Provider value={value}>
      {children}
    </TimeRangeContext.Provider>
  );
};