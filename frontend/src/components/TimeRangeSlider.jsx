import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { Calendar, Play, Pause, RotateCcw } from 'lucide-react';

const TimeRangeSlider = ({ onDateRangeChange, selectedPreset, dateRange }) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentSliderValue, setCurrentSliderValue] = useState(0);
  
  // Time periods similar to the reference image
  const timePeriods = [
    { key: 'current_month', label: 'Current month', months: 1 },
    { key: '3_months', label: '3 months', months: 3 },
    { key: '6_months', label: '6 months', months: 6 },
    { key: '12_months', label: '12 months', months: 12 },
    { key: 'all_time', label: 'All Time', months: null }
  ];

  // Auto-play through time periods
  useEffect(() => {
    let interval;
    if (isPlaying) {
      interval = setInterval(() => {
        setCurrentSliderValue(prev => {
          const next = (prev + 1) % timePeriods.length;
          const selectedPeriod = timePeriods[next];
          handlePeriodChange(selectedPeriod.key);
          return next;
        });
      }, 2000); // Change every 2 seconds
    }
    return () => clearInterval(interval);
  }, [isPlaying]);

  const handlePeriodChange = (periodKey) => {
    const period = timePeriods.find(p => p.key === periodKey);
    if (!period) return;

    const endDate = new Date().toISOString().split('T')[0];
    let startDate;

    if (period.key === 'all_time') {
      startDate = '2000-01-01';
    } else if (period.key === 'current_month') {
      startDate = new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().split('T')[0];
    } else {
      const monthsAgo = new Date();
      monthsAgo.setMonth(monthsAgo.getMonth() - period.months);
      startDate = monthsAgo.toISOString().split('T')[0];
    }

    onDateRangeChange(periodKey, { startDate, endDate });
  };

  const handleSliderChange = (event) => {
    const value = parseInt(event.target.value);
    setCurrentSliderValue(value);
    const selectedPeriod = timePeriods[value];
    handlePeriodChange(selectedPeriod.key);
  };

  const togglePlay = () => {
    setIsPlaying(!isPlaying);
  };

  const reset = () => {
    setIsPlaying(false);
    setCurrentSliderValue(4); // All time
    handlePeriodChange('all_time');
  };

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            Time Range Control
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={togglePlay}
              className="flex items-center gap-2"
            >
              {isPlaying ? (
                <>
                  <Pause className="h-3 w-3" />
                  Pause
                </>
              ) : (
                <>
                  <Play className="h-3 w-3" />
                  Auto-Play
                </>
              )}
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={reset}
              className="flex items-center gap-2"
            >
              <RotateCcw className="h-3 w-3" />
              Reset
            </Button>
          </div>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {/* Time Period Buttons */}
          <div className="flex flex-wrap gap-2 justify-center">
            {timePeriods.map((period, index) => (
              <Button
                key={period.key}
                variant={
                  selectedPreset === period.key || currentSliderValue === index
                    ? 'default'
                    : 'outline'
                }
                size="sm"
                onClick={() => {
                  setCurrentSliderValue(index);
                  handlePeriodChange(period.key);
                }}
                className={`transition-all duration-200 ${
                  selectedPreset === period.key || currentSliderValue === index
                    ? 'bg-blue-500 text-white'
                    : 'hover:bg-blue-50'
                }`}
              >
                {period.label}
              </Button>
            ))}
          </div>

          {/* Time Range Slider */}
          <div className="relative px-4">
            <div className="flex justify-between text-xs text-muted-foreground mb-2">
              <span>Current</span>
              <span>Historical</span>
            </div>
            
            <div className="relative">
              {/* Slider track background */}
              <div className="w-full h-2 bg-gray-200 rounded-full">
                <div 
                  className="h-2 bg-blue-500 rounded-full transition-all duration-300"
                  style={{ width: `${((currentSliderValue + 1) / timePeriods.length) * 100}%` }}
                />
              </div>
              
              {/* Slider input */}
              <input
                type="range"
                min="0"
                max={timePeriods.length - 1}
                value={currentSliderValue}
                onChange={handleSliderChange}
                className="absolute top-0 w-full h-2 opacity-0 cursor-pointer"
              />
              
              {/* Timeline markers */}
              <div className="flex justify-between mt-3">
                {timePeriods.map((period, index) => (
                  <div
                    key={period.key}
                    className={`text-xs transition-all duration-200 ${
                      currentSliderValue >= index
                        ? 'text-blue-600 font-medium'
                        : 'text-gray-400'
                    }`}
                  >
                    {period.months ? `${period.months}M` : 'All'}
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Current Selection Display */}
          <div className="text-center">
            <Badge variant="secondary" className="px-3 py-1">
              {timePeriods[currentSliderValue]?.label}
            </Badge>
            <div className="text-xs text-muted-foreground mt-2">
              {dateRange.startDate} to {dateRange.endDate}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default TimeRangeSlider;