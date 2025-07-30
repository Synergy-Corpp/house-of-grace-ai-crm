
import React, { useState } from "react";
import { format, addDays, startOfWeek, subWeeks, addWeeks } from "date-fns";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight, Calendar } from "lucide-react";

interface WeeklyOptionBarProps {
  onSelectDay?: (date: Date) => void;
}

const WeeklyOptionBar: React.FC<WeeklyOptionBarProps> = ({ onSelectDay }) => {
  const [currentWeekStart, setCurrentWeekStart] = useState(() => 
    startOfWeek(new Date(), { weekStartsOn: 0 }) // 0 = Sunday
  );
  const [selectedDay, setSelectedDay] = useState<Date | null>(new Date());

  // Generate array of dates for the week
  const weekDays = Array.from({ length: 7 }).map((_, index) => 
    addDays(currentWeekStart, index)
  );

  const navigateToPreviousWeek = () => {
    setCurrentWeekStart(prev => subWeeks(prev, 1));
  };

  const navigateToNextWeek = () => {
    setCurrentWeekStart(prev => addWeeks(prev, 1));
  };

  const handleDaySelect = (day: Date) => {
    setSelectedDay(day);
    if (onSelectDay) {
      onSelectDay(day);
    }
  };

  // Check if a day is today
  const isToday = (day: Date) => {
    const today = new Date();
    return (
      day.getDate() === today.getDate() &&
      day.getMonth() === today.getMonth() &&
      day.getFullYear() === today.getFullYear()
    );
  };

  // Check if a day is selected
  const isDaySelected = (day: Date) => {
    if (!selectedDay) return false;
    return (
      day.getDate() === selectedDay.getDate() &&
      day.getMonth() === selectedDay.getMonth() &&
      day.getFullYear() === selectedDay.getFullYear()
    );
  };

  // Format week range (e.g., "May 11 - May 17")
  const weekRange = `${format(weekDays[0], "MMM d")} - ${format(weekDays[6], "MMM d")}`;

  return (
    <div className="mb-6">
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center">
          <Calendar className="mr-2 h-5 w-5 text-gray-500" />
          <h2 className="text-lg font-medium">Week: {weekRange}</h2>
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={navigateToPreviousWeek}
            className="h-8 px-2"
          >
            <ChevronLeft className="h-4 w-4" />
            <span className="ml-1">Previous</span>
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={navigateToNextWeek}
            className="h-8 px-2"
          >
            <span className="mr-1">Next</span>
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-7 gap-1 sm:gap-2">
        {weekDays.map((day, index) => (
          <Card
            key={index}
            className={`
              cursor-pointer transition-all duration-200 
              ${isDaySelected(day) ? 'bg-blue-100 border-blue-300' : 'hover:bg-gray-50'} 
              ${isToday(day) && !isDaySelected(day) ? 'bg-amber-50 border-amber-200' : ''}
            `}
            onClick={() => handleDaySelect(day)}
          >
            <div className="flex flex-col items-center py-1.5 px-1">
              <span className="text-xs font-medium text-gray-500">{format(day, "EEE")}</span>
              <span className={`text-sm sm:text-base font-semibold ${isToday(day) ? 'text-amber-600' : isDaySelected(day) ? 'text-blue-600' : ''}`}>
                {format(day, "d")}
              </span>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
};

export default WeeklyOptionBar;
