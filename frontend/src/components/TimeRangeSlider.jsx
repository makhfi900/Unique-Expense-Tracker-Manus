import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { useTimeRange } from '../context/TimeRangeContext';
import { useAuth } from '../context/SupabaseAuthContext';
import { Calendar } from 'lucide-react';

const TimeRangeSlider = () => {
  const { 
    dateRange, 
    selectedPreset, 
    datePresets,
    handlePresetChange, 
    handleDateRangeChange 
  } = useTimeRange();
  
  const { isAdmin, isAccountOfficer } = useAuth();
  
  // Simple dual slider state management
  const [isDragging, setIsDragging] = useState(false);
  const [draggedHandle, setDraggedHandle] = useState(null);
  const sliderRef = useRef(null);
  
  // Simple timeline configuration (current year ± 2 years)
  const currentYear = new Date().getFullYear();
  const startYear = currentYear - 2;
  const endYear = currentYear + 2;
  const totalYears = endYear - startYear + 1;
  
  // Period buttons - simple and clean
  const periodButtons = [
    { key: 'current_month', label: 'Current Month' },
    { key: '3_months', label: '3 Months' },
    { key: '6_months', label: '6 Months' },
    { key: '12_months', label: '12 Months' },
  ];

  // Simple custom range label
  const getCustomRangeLabel = () => {
    if (!dateRange.startDate || !dateRange.endDate) return 'Custom Range';
    
    const start = new Date(dateRange.startDate);
    const end = new Date(dateRange.endDate);
    
    const formatDate = (date) => {
      return date.toLocaleDateString('en-US', { 
        month: 'short', 
        year: 'numeric'
      });
    };
    
    return `${formatDate(start)} - ${formatDate(end)}`;
  };

  // Handle period button selection
  const handlePeriodButtonClick = (periodKey) => {
    handlePresetChange(periodKey);
  };

  // Simple date to position conversion
  const dateToPosition = useCallback((dateString) => {
    const date = new Date(dateString);
    const startDate = new Date(startYear, 0, 1);
    const endDate = new Date(endYear, 11, 31);
    
    const totalTime = endDate.getTime() - startDate.getTime();
    const elapsedTime = date.getTime() - startDate.getTime();
    
    const position = (elapsedTime / totalTime) * 100;
    return Math.max(0, Math.min(100, position));
  }, [startYear, endYear]);
  
  // Improved position to date conversion with better precision
  const positionToDate = useCallback((percentage) => {
    const startDate = new Date(startYear, 0, 1);
    const endDate = new Date(endYear, 11, 31);
    const totalTime = endDate.getTime() - startDate.getTime();
    
    const targetTime = startDate.getTime() + (percentage / 100) * totalTime;
    const targetDate = new Date(targetTime);
    
    // Round to nearest day to avoid fractional dates
    targetDate.setHours(0, 0, 0, 0);
    
    return targetDate.toISOString().split('T')[0];
  }, [startYear, endYear]);
  
  // Simple slider click handler
  const handleSliderClick = useCallback((event) => {
    if (isDragging || !sliderRef.current) return;
    
    const rect = sliderRef.current.getBoundingClientRect();
    const clickX = event.clientX - rect.left;
    const percentage = Math.max(0, Math.min(100, (clickX / rect.width) * 100));
    const newDate = positionToDate(percentage);
    
    // Determine which handle is closer
    const startPos = dateToPosition(dateRange.startDate);
    const endPos = dateToPosition(dateRange.endDate);
    const distToStart = Math.abs(percentage - startPos);
    const distToEnd = Math.abs(percentage - endPos);
    
    if (distToStart <= distToEnd) {
      // Move start handle
      if (new Date(newDate) < new Date(dateRange.endDate)) {
        handleDateRangeChange('startDate', newDate);
      }
    } else {
      // Move end handle
      if (new Date(newDate) > new Date(dateRange.startDate)) {
        handleDateRangeChange('endDate', newDate);
      }
    }
    
    handlePresetChange('custom');
  }, [isDragging, dateRange, dateToPosition, positionToDate, handleDateRangeChange, handlePresetChange]);
  
  // Enhanced mouse down handler with immediate state update
  const handleMouseDown = useCallback((event, handleType) => {
    // Prevent all default behaviors and stop propagation
    event.preventDefault();
    event.stopPropagation();
    
    // Immediate state update - crucial for drag detection
    setIsDragging(true);
    setDraggedHandle(handleType);
    
    // Visual feedback: Add immediate cursor change
    document.body.style.cursor = 'grabbing';
    document.body.style.userSelect = 'none';
    
    // For accessibility: Add focus to the slider container
    if (sliderRef.current) {
      sliderRef.current.focus();
    }
  }, []);
  
  // Optimized mouse move handler for smooth real-time drag updates
  const handleMouseMove = useCallback((event) => {
    // Only proceed if actively dragging
    if (!isDragging || !draggedHandle || !sliderRef.current) {
      return;
    }
    
    // Get position calculations
    const rect = sliderRef.current.getBoundingClientRect();
    const currentX = event.clientX - rect.left;
    const percentage = Math.max(0, Math.min(100, (currentX / rect.width) * 100));
    
    // Get new date and validate it
    const newDate = positionToDate(percentage);
    if (!newDate) return;
    
    // Throttled updates to prevent excessive re-renders
    const newTime = new Date(newDate).getTime();
    
    // Update the appropriate handle with boundary validation
    if (draggedHandle === 'start') {
      const endTime = new Date(dateRange.endDate).getTime();
      const currentStartTime = new Date(dateRange.startDate).getTime();
      
      // Only update if the date actually changed and is valid
      if (newTime !== currentStartTime && newTime < endTime) {
        handleDateRangeChange('startDate', newDate);
        // Only switch to custom if not already custom
        if (selectedPreset !== 'custom') {
          handlePresetChange('custom');
        }
      }
    } else if (draggedHandle === 'end') {
      const startTime = new Date(dateRange.startDate).getTime();
      const currentEndTime = new Date(dateRange.endDate).getTime();
      
      // Only update if the date actually changed and is valid
      if (newTime !== currentEndTime && newTime > startTime) {
        handleDateRangeChange('endDate', newDate);
        // Only switch to custom if not already custom
        if (selectedPreset !== 'custom') {
          handlePresetChange('custom');
        }
      }
    }
  }, [isDragging, draggedHandle, dateRange, selectedPreset, positionToDate, handleDateRangeChange, handlePresetChange]);
  
  // Clean mouse up handler to complete drag operations
  const handleMouseUp = useCallback((event) => {
    if (isDragging) {
      // End drag operation
      setIsDragging(false);
      setDraggedHandle(null);
      
      // Clean up visual feedback
      document.body.style.cursor = '';
      document.body.style.userSelect = '';
      
      // Prevent accidental clicks after drag
      if (event) {
        event.preventDefault();
        event.stopPropagation();
      }
    }
  }, [isDragging]);
  
  // Global event listeners for drag operations
  useEffect(() => {
    // Only attach listeners when actually dragging to improve performance
    if (!isDragging) return;

    // Attach global mouse events to capture movements outside slider
    const handleGlobalMouseMove = (e) => {
      e.preventDefault();
      handleMouseMove(e);
    };

    const handleGlobalMouseUp = (e) => {
      e.preventDefault();
      handleMouseUp(e);
    };

    // Enhanced touch move handler for better mobile support
    const handleGlobalTouchMove = (e) => {
      if (e.touches[0]) {
        e.preventDefault();
        const touch = e.touches[0];
        const syntheticEvent = {
          preventDefault: () => {},
          stopPropagation: () => {},
          clientX: touch.clientX,
          clientY: touch.clientY
        };
        handleMouseMove(syntheticEvent);
      }
    };

    const handleGlobalTouchEnd = (e) => {
      e.preventDefault();
      handleMouseUp({ preventDefault: () => {}, stopPropagation: () => {} });
    };

    // Add listeners
    document.addEventListener('mousemove', handleGlobalMouseMove, { passive: false });
    document.addEventListener('mouseup', handleGlobalMouseUp, { passive: false });
    document.addEventListener('touchmove', handleGlobalTouchMove, { passive: false });
    document.addEventListener('touchend', handleGlobalTouchEnd, { passive: false });

    // Apply drag visual feedback
    document.body.style.userSelect = 'none';
    document.body.style.cursor = 'grabbing';
    
    return () => {
      document.removeEventListener('mousemove', handleGlobalMouseMove);
      document.removeEventListener('mouseup', handleGlobalMouseUp);
      document.removeEventListener('touchmove', handleGlobalTouchMove);
      document.removeEventListener('touchend', handleGlobalTouchEnd);
      document.body.style.userSelect = '';
      document.body.style.cursor = '';
    };
  }, [isDragging, handleMouseMove, handleMouseUp]);

  // Simple position calculations
  const getStartPosition = () => dateToPosition(dateRange.startDate);
  const getEndPosition = () => dateToPosition(dateRange.endDate);

  // Simple year markers
  const generateYearMarkers = () => {
    const years = [];
    for (let year = startYear; year <= endYear; year++) {
      years.push(year);
    }
    return years;
  };

  return (
    <div className="w-full space-y-6 p-6 bg-gradient-to-br from-slate-50 to-blue-50/30 dark:from-slate-900 dark:to-blue-950/30 border border-slate-200/60 dark:border-slate-700/60 rounded-xl shadow-lg backdrop-blur-sm">
      {/* Professional Header with Enhanced Typography */}
      <div className="flex items-center justify-between">
        <div className="space-y-1">
          <h3 className="text-xl font-bold bg-gradient-to-r from-slate-800 to-blue-700 dark:from-slate-200 dark:to-blue-300 bg-clip-text text-transparent">
            Time Range Selector
          </h3>
          <p className="text-sm text-slate-600 dark:text-slate-400 font-medium">
            Select your date range with precision
          </p>
        </div>
        <div className="text-right">
          {dateRange.startDate && dateRange.endDate && (
            <div className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-950/50 dark:to-indigo-950/50 px-4 py-3 rounded-xl border border-blue-200/50 dark:border-blue-700/50 shadow-sm">
              <div className="text-sm font-semibold text-slate-800 dark:text-slate-200">
                {new Date(dateRange.startDate).toLocaleDateString('en-US', { 
                  month: 'short', 
                  year: 'numeric' 
                })} — {new Date(dateRange.endDate).toLocaleDateString('en-US', { 
                  month: 'short', 
                  year: 'numeric' 
                })}
              </div>
              <div className="text-xs text-slate-600 dark:text-slate-400 mt-0.5">
                Selected Range
              </div>
            </div>
          )}
        </div>
      </div>
      
      {/* Enhanced Period Buttons with Better Styling */}
      <div className="flex flex-wrap gap-2.5">
        {periodButtons.map((period) => (
          <Button
            key={period.key}
            variant={selectedPreset === period.key ? 'default' : 'outline'}
            size="sm"
            className={`
              transition-all duration-200 ease-in-out font-medium shadow-sm
              ${selectedPreset === period.key 
                ? 'bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white shadow-md transform hover:scale-105' 
                : 'bg-white dark:bg-slate-800 hover:bg-blue-50 dark:hover:bg-slate-700 border-slate-300 dark:border-slate-600 hover:border-blue-300 dark:hover:border-blue-600 hover:shadow-md transform hover:scale-105'
              }
            `}
            onClick={() => handlePeriodButtonClick(period.key)}
          >
            {period.label}
          </Button>
        ))}
        
        <Button
          variant={selectedPreset === 'custom' ? 'default' : 'outline'}
          size="sm"
          className={`
            transition-all duration-200 ease-in-out font-medium shadow-sm
            ${selectedPreset === 'custom' 
              ? 'bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white shadow-md transform hover:scale-105' 
              : 'bg-white dark:bg-slate-800 hover:bg-emerald-50 dark:hover:bg-slate-700 border-slate-300 dark:border-slate-600 hover:border-emerald-300 dark:hover:border-emerald-600 hover:shadow-md transform hover:scale-105'
            }
          `}
          onClick={() => handlePresetChange('custom')}
        >
          {getCustomRangeLabel()}
        </Button>
      </div>

      {/* Professional Slider with Enhanced Design */}
      <div className="w-full space-y-4">
        <div className="flex items-center justify-between text-sm font-medium text-slate-600 dark:text-slate-400">
          <span className="bg-slate-100 dark:bg-slate-800 px-2 py-1 rounded-md">{startYear}</span>
          <span className="text-center italic">Drag handles to adjust your time range</span>
          <span className="bg-slate-100 dark:bg-slate-800 px-2 py-1 rounded-md">{endYear}</span>
        </div>
        <div 
          ref={sliderRef}
          className={`
            relative w-full h-16 rounded-xl cursor-pointer transition-all duration-300 ease-in-out
            bg-gradient-to-r from-slate-100 via-slate-50 to-slate-100 
            dark:from-slate-800 dark:via-slate-900 dark:to-slate-800
            border-2 border-slate-200/60 dark:border-slate-700/60
            shadow-inner hover:shadow-md focus:outline-none focus:ring-2 focus:ring-blue-500
            ${isDragging ? 'cursor-grabbing shadow-lg scale-[1.01]' : 'hover:shadow-md'}
          `}
          onClick={handleSliderClick}
          style={{ touchAction: 'none' }}
          tabIndex={0}
          role="slider"
          aria-label="Time range slider"
          aria-valuenow={getStartPosition()}
          aria-valuemin={0}
          aria-valuemax={100}
        >
          {/* Enhanced Track with Gradient */}
          <div className="absolute inset-x-4 top-1/2 transform -translate-y-1/2 h-3 bg-gradient-to-r from-slate-300 via-slate-200 to-slate-300 dark:from-slate-600 dark:via-slate-700 dark:to-slate-600 rounded-full shadow-inner"></div>
          
          {/* Enhanced Selected Range with Professional Gradient */}
          <div
            className="absolute top-1/2 transform -translate-y-1/2 h-3 rounded-full shadow-lg transition-all duration-200 ease-in-out bg-gradient-to-r from-blue-500 via-indigo-500 to-purple-500 dark:from-blue-400 dark:via-indigo-400 dark:to-purple-400"
            style={{
              left: `${getStartPosition()}%`,
              width: `${Math.max(0, getEndPosition() - getStartPosition())}%`
            }}
          >
            <div className="absolute inset-0 bg-white/20 rounded-full"></div>
          </div>
          
          {/* Enhanced Year Markers */}
          {generateYearMarkers().map((year, index) => {
            const position = (index / (totalYears - 1)) * 100;
            return (
              <div
                key={year}
                className="absolute top-0 h-full flex items-end pb-2 text-xs font-medium text-slate-500 dark:text-slate-400 pointer-events-none"
                style={{ left: `${position}%`, transform: 'translateX(-50%)' }}
              >
                <div className="bg-white/80 dark:bg-slate-800/80 px-1.5 py-0.5 rounded shadow-sm backdrop-blur-sm">
                  {year}
                </div>
              </div>
            );
          })}
          
          {/* Professional Start Handle with Enhanced Design */}
          <div
            className={`
              absolute top-1/2 transform -translate-y-1/2 -translate-x-1/2 z-20 cursor-grab 
              transition-all duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-emerald-400
              ${isDragging && draggedHandle === 'start' 
                ? 'cursor-grabbing scale-125 rotate-12' 
                : 'hover:scale-110 hover:-rotate-3'
              }
            `}
            style={{ left: `${getStartPosition()}%` }}
            onMouseDown={(e) => handleMouseDown(e, 'start')}
            onTouchStart={(e) => {
              e.preventDefault();
              const touch = e.touches[0];
              handleMouseDown({ 
                preventDefault: () => {}, 
                stopPropagation: () => {}, 
                clientX: touch.clientX, 
                clientY: touch.clientY 
              }, 'start');
            }}
            title={`Start: ${new Date(dateRange.startDate).toLocaleDateString()}`}
            tabIndex={0}
            role="button"
            aria-label={`Start date handle: ${new Date(dateRange.startDate).toLocaleDateString()}`}
          >
            {/* Handle Shadow */}
            <div className="absolute inset-0 w-7 h-7 bg-emerald-600/20 rounded-full blur-md transform translate-y-1"></div>
            
            {/* Main Handle */}
            <div className="relative w-7 h-7 bg-gradient-to-br from-emerald-400 to-teal-600 rounded-full border-3 border-white dark:border-slate-800 shadow-lg">
              {/* Inner Glow */}
              <div className="absolute inset-0.5 bg-gradient-to-br from-white/40 to-transparent rounded-full"></div>
              
              {/* Center Dot */}
              <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-2 h-2 bg-white/80 rounded-full shadow-sm"></div>
              
              {/* Drag Indicator */}
              <div className="absolute -top-8 left-1/2 transform -translate-x-1/2 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                <div className="bg-slate-800 dark:bg-slate-200 text-white dark:text-slate-800 text-xs px-2 py-1 rounded shadow-lg whitespace-nowrap font-medium">
                  Start Date
                </div>
              </div>
            </div>
          </div>
          
          {/* Professional End Handle with Enhanced Design */}
          <div
            className={`
              absolute top-1/2 transform -translate-y-1/2 -translate-x-1/2 z-20 cursor-grab 
              transition-all duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-rose-400
              ${isDragging && draggedHandle === 'end' 
                ? 'cursor-grabbing scale-125 -rotate-12' 
                : 'hover:scale-110 hover:rotate-3'
              }
            `}
            style={{ left: `${getEndPosition()}%` }}
            onMouseDown={(e) => handleMouseDown(e, 'end')}
            onTouchStart={(e) => {
              e.preventDefault();
              const touch = e.touches[0];
              handleMouseDown({ 
                preventDefault: () => {}, 
                stopPropagation: () => {}, 
                clientX: touch.clientX, 
                clientY: touch.clientY 
              }, 'end');
            }}
            title={`End: ${new Date(dateRange.endDate).toLocaleDateString()}`}
            tabIndex={0}
            role="button"
            aria-label={`End date handle: ${new Date(dateRange.endDate).toLocaleDateString()}`}
          >
            {/* Handle Shadow */}
            <div className="absolute inset-0 w-7 h-7 bg-rose-600/20 rounded-full blur-md transform translate-y-1"></div>
            
            {/* Main Handle */}
            <div className="relative w-7 h-7 bg-gradient-to-br from-rose-400 to-red-600 rounded-full border-3 border-white dark:border-slate-800 shadow-lg">
              {/* Inner Glow */}
              <div className="absolute inset-0.5 bg-gradient-to-br from-white/40 to-transparent rounded-full"></div>
              
              {/* Center Dot */}
              <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-2 h-2 bg-white/80 rounded-full shadow-sm"></div>
              
              {/* Drag Indicator */}
              <div className="absolute -top-8 left-1/2 transform -translate-x-1/2 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                <div className="bg-slate-800 dark:bg-slate-200 text-white dark:text-slate-800 text-xs px-2 py-1 rounded shadow-lg whitespace-nowrap font-medium">
                  End Date
                </div>
              </div>
            </div>
          </div>
        </div>
        
        {/* Professional Status Indicator */}
        <div className="flex items-center justify-center space-x-2 mt-3">
          <div className={`w-2 h-2 rounded-full transition-colors duration-300 ${isDragging ? 'bg-blue-500 animate-pulse' : 'bg-green-500'}`}></div>
          <span className="text-xs font-medium text-slate-600 dark:text-slate-400">
            {isDragging ? 'Adjusting range...' : 'Range ready'}
          </span>
        </div>
        
        {/* Account Officer Direct Date Controls - CRITICAL ADDITION */}
        {isAccountOfficer && (
          <div className="mt-6 p-4 bg-gradient-to-br from-orange-50 to-amber-50 dark:from-orange-950/30 dark:to-amber-950/30 border-2 border-orange-200 dark:border-orange-800 rounded-xl">
            <div className="flex items-center gap-2 mb-4">
              <Calendar className="h-5 w-5 text-orange-600" />
              <h4 className="text-lg font-semibold text-orange-800 dark:text-orange-200">
                Account Officer - Direct Date Entry
              </h4>
            </div>
            <p className="text-sm text-orange-700 dark:text-orange-300 mb-4">
              For precise date filtering, enter specific start and end dates below. These controls override the slider above.
            </p>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="account-start-date" className="text-sm font-semibold text-orange-800 dark:text-orange-200 flex items-center gap-1">
                  <Calendar className="h-3 w-3" />
                  Start Date <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="account-start-date"
                  type="date"
                  value={dateRange.startDate}
                  onChange={(e) => {
                    handleDateRangeChange('startDate', e.target.value);
                    handlePresetChange('custom');
                  }}
                  className="border-orange-300 dark:border-orange-700 focus:border-orange-500 focus:ring-orange-500 bg-white dark:bg-slate-800"
                  required
                />
                <p className="text-xs text-orange-600 dark:text-orange-400 mt-1">
                  Enter the earliest date for your expense search
                </p>
              </div>
              
              <div>
                <Label htmlFor="account-end-date" className="text-sm font-semibold text-orange-800 dark:text-orange-200 flex items-center gap-1">
                  <Calendar className="h-3 w-3" />
                  End Date <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="account-end-date"
                  type="date"
                  value={dateRange.endDate}
                  onChange={(e) => {
                    handleDateRangeChange('endDate', e.target.value);
                    handlePresetChange('custom');
                  }}
                  className="border-orange-300 dark:border-orange-700 focus:border-orange-500 focus:ring-orange-500 bg-white dark:bg-slate-800"
                  required
                />
                <p className="text-xs text-orange-600 dark:text-orange-400 mt-1">
                  Enter the latest date for your expense search
                </p>
              </div>
            </div>
            
            {/* Account Officer Quick Actions */}
            <div className="flex flex-wrap gap-2 mt-4 pt-3 border-t border-orange-200 dark:border-orange-800">
              <Button
                onClick={() => {
                  const today = new Date().toISOString().split('T')[0];
                  const firstOfMonth = new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().split('T')[0];
                  handleDateRangeChange('startDate', firstOfMonth);
                  handleDateRangeChange('endDate', today);
                  handlePresetChange('custom');
                }}
                size="sm"
                variant="outline"
                className="border-orange-300 text-orange-700 hover:bg-orange-50 dark:hover:bg-orange-950/50"
              >
                <Calendar className="h-3 w-3 mr-1" />
                Current Month
              </Button>
              
              <Button
                onClick={() => {
                  const today = new Date().toISOString().split('T')[0];
                  const quarterStart = new Date(new Date().getFullYear(), Math.floor(new Date().getMonth() / 3) * 3, 1).toISOString().split('T')[0];
                  handleDateRangeChange('startDate', quarterStart);
                  handleDateRangeChange('endDate', today);
                  handlePresetChange('custom');
                }}
                size="sm"
                variant="outline"
                className="border-orange-300 text-orange-700 hover:bg-orange-50 dark:hover:bg-orange-950/50"
              >
                <Calendar className="h-3 w-3 mr-1" />
                Current Quarter
              </Button>
              
              <Button
                onClick={() => {
                  const today = new Date().toISOString().split('T')[0];
                  const yearStart = new Date(new Date().getFullYear(), 0, 1).toISOString().split('T')[0];
                  handleDateRangeChange('startDate', yearStart);
                  handleDateRangeChange('endDate', today);
                  handlePresetChange('custom');
                }}
                size="sm"
                variant="outline"
                className="border-orange-300 text-orange-700 hover:bg-orange-50 dark:hover:bg-orange-950/50"
              >
                <Calendar className="h-3 w-3 mr-1" />
                Year to Date
              </Button>
            </div>
            
            <div className="mt-3 text-xs text-orange-600 dark:text-orange-400 bg-orange-100/50 dark:bg-orange-950/20 p-2 rounded border border-orange-200/50 dark:border-orange-800/50">
              <strong>Note:</strong> These date controls are specifically provided for account officers to ensure precise expense filtering and reporting capabilities.
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default TimeRangeSlider;