/**
 * Time utility class for handling time conversions and formatting
 * Used by the PrayerReminderForm component for time management
 */
export class TimeUtil {
  hour: number;
  minute: number;

  constructor(hour: number, minute: number) {
    this.hour = hour;
    this.minute = minute;
  }

  /**
   * Formats the time to HH:MM string
   */
  toString(): string {
    return `${this.hour.toString().padStart(2, '0')}:${this.minute.toString().padStart(2, '0')}`;
  }

  /**
   * Creates a TimeUtil instance from 12-hour format components
   */
  static from12Hour(hour: number, minute: number, ampm: string): TimeUtil {
    let h = hour;
    if (ampm === 'PM' && hour !== 12) {
      h += 12;
    } else if (ampm === 'AM' && hour === 12) {
      h = 0;
    }
    return new TimeUtil(h, minute);
  }

  /**
   * Parses a time string or Date into a TimeUtil instance
   */
  static parse(timeStr: string | Date | null): TimeUtil {
    if (!timeStr) return new TimeUtil(9, 0);
    
    try {
      if (timeStr instanceof Date) {
        return new TimeUtil(timeStr.getUTCHours(), timeStr.getUTCMinutes());
      }
      
      const [hours, minutes] = timeStr.split(':').map(Number);
      return new TimeUtil(hours || 9, minutes || 0);
    } catch (e) {
      return new TimeUtil(9, 0);
    }
  }
} 