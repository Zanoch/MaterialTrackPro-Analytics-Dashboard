import { useState, useRef, useEffect } from 'react';
import { Calendar, ChevronDown, ChevronLeft, ChevronRight } from 'lucide-react';
import { computePosition, flip, shift, offset } from '@floating-ui/react-dom';

interface MonthPickerProps {
  value: Date;
  onChange: (date: Date) => void;
  className?: string;
}

export function MonthPicker({ value, onChange, className = '' }: MonthPickerProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [viewYear, setViewYear] = useState(value.getFullYear());
  const dropdownRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);

  const months = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];

  const currentMonth = value.getMonth();
  const currentYear = value.getFullYear();

  // Close dropdown when clicking outside and reset view year
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      const target = event.target as Node;
      const clickedOutsideDropdown = dropdownRef.current && !dropdownRef.current.contains(target);
      const clickedOutsideButton = buttonRef.current && !buttonRef.current.contains(target);

      if (isOpen && clickedOutsideDropdown && clickedOutsideButton) {
        setIsOpen(false);
        // Reset view year to selected value when dismissed
        setViewYear(value.getFullYear());
      }
    }

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen, value]);

  // Position dropdown using floating-ui
  useEffect(() => {
    if (isOpen && buttonRef.current && dropdownRef.current) {
      computePosition(buttonRef.current, dropdownRef.current, {
        placement: 'bottom-start',
        middleware: [
          offset(8), // 8px gap between button and dropdown
          flip(), // Flip to opposite side if no space
          shift({ padding: 8 }) // Keep dropdown 8px away from viewport edges
        ]
      }).then(({ x, y }) => {
        if (dropdownRef.current) {
          dropdownRef.current.style.left = `${x}px`;
          dropdownRef.current.style.top = `${y}px`;
        }
      });
    }
  }, [isOpen]);

  // Handle keyboard navigation
  useEffect(() => {
    function handleKeyDown(event: KeyboardEvent) {
      if (!isOpen) return;

      switch (event.key) {
        case 'Escape':
          setIsOpen(false);
          setViewYear(value.getFullYear());
          buttonRef.current?.focus();
          break;
        case 'Tab':
          // Allow tab navigation within dropdown, close on tab out
          // Use setTimeout to check after the tab navigation completes
          setTimeout(() => {
            const activeElement = document.activeElement;
            if (dropdownRef.current && activeElement && !dropdownRef.current.contains(activeElement)) {
              setIsOpen(false);
              setViewYear(value.getFullYear());
            }
          }, 0);
          break;
      }
    }

    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, value]);

  const handleMonthSelect = (monthIndex: number) => {
    const newDate = new Date(viewYear, monthIndex, 1);
    onChange(newDate);
    setIsOpen(false);
  };

  const handleYearChange = (direction: 'prev' | 'next') => {
    const newYear = direction === 'prev' ? viewYear - 1 : viewYear + 1;
    setViewYear(newYear);
  };

  const displayText = `${months[currentMonth]} ${currentYear}`;

  return (
    <>
      {/* Trigger Button */}
      <button
        ref={buttonRef}
        type="button"
        onClick={() => {
          const newIsOpen = !isOpen;
          setIsOpen(newIsOpen);
          // Reset view year to selected value when toggling
          if (!newIsOpen) {
            setViewYear(value.getFullYear());
          }
        }}
        className={`flex items-center gap-2 px-3 py-1 text-sm border border-gray-300 rounded-md bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-tea-500 focus:border-tea-500 transition-colors ${className}`}
        aria-haspopup="dialog"
        aria-expanded={isOpen}
        aria-label={`Select month and year, currently ${displayText}`}
      >
        <Calendar className="h-4 w-4 text-gray-400" />
        <span className="text-gray-700">{displayText}</span>
        <ChevronDown className={`h-4 w-4 text-gray-400 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {/* Dropdown */}
      {isOpen && (
        <div
          ref={dropdownRef}
          className="fixed w-80 bg-white border border-gray-200 rounded-md shadow-lg z-50"
          style={{ top: 0, left: 0 }} // Will be overridden by floating-ui
          role="dialog"
          aria-modal="true"
          aria-labelledby="month-picker-title"
        >
          <div className="p-4">
            {/* Year Navigation */}
            <div className="flex items-center justify-between mb-4">
              <button
                type="button"
                onClick={() => handleYearChange('prev')}
                className="p-1 hover:bg-gray-100 rounded-md transition-colors focus:outline-none focus:ring-2 focus:ring-tea-500"
                aria-label={`Previous year, go to ${viewYear - 1}`}
              >
                <ChevronLeft className="h-4 w-4 text-gray-600" />
              </button>
              <h3 id="month-picker-title" className="font-medium text-gray-900">{viewYear}</h3>
              <button
                type="button"
                onClick={() => handleYearChange('next')}
                className="p-1 hover:bg-gray-100 rounded-md transition-colors focus:outline-none focus:ring-2 focus:ring-tea-500"
                aria-label={`Next year, go to ${viewYear + 1}`}
              >
                <ChevronRight className="h-4 w-4 text-gray-600" />
              </button>
            </div>

            {/* Month Grid */}
            <div className="grid grid-cols-3 gap-2" role="grid" aria-label="Select month">
              {months.map((month, index) => {
                const isSelected = index === currentMonth && viewYear === currentYear;
                const isCurrent = index === new Date().getMonth() && viewYear === new Date().getFullYear();

                return (
                  <button
                    key={month}
                    type="button"
                    onClick={() => handleMonthSelect(index)}
                    className={`px-3 py-2 text-sm rounded-md transition-colors focus:outline-none focus:ring-2 focus:ring-tea-500 ${
                      isSelected
                        ? 'bg-tea-600 text-white'
                        : isCurrent
                        ? 'bg-tea-100 text-tea-700 hover:bg-tea-200'
                        : 'text-gray-700 hover:bg-gray-100'
                    }`}
                    role="gridcell"
                    aria-selected={isSelected}
                    aria-label={`${month} ${viewYear}${isSelected ? ', currently selected' : ''}${isCurrent ? ', current month' : ''}`}
                  >
                    {month.slice(0, 3)}
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      )}
    </>
  );
}