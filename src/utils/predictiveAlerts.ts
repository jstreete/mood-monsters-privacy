import { Incident } from '../types';
import { getHours } from 'date-fns';

export interface PatternAlert {
  id: string;
  title: string;
  message: string;
  icon: string;
}

export function detectPredictiveAlerts(incidents: Incident[]): PatternAlert | null {
  if (!incidents || incidents.length < 3) {
    return null;
  }

  // 1. Check time-of-day clusters
  const hourCounts: Record<number, number> = {};
  incidents.forEach((inc) => {
    const hour = getHours(new Date(inc.timestamp));
    hourCounts[hour] = (hourCounts[hour] || 0) + 1;
  });

  // Check evening transition cluster (4 PM - 6 PM: hours 16, 17, 18)
  const eveningCount = (hourCounts[16] || 0) + (hourCounts[17] || 0) + (hourCounts[18] || 0);
  if (eveningCount >= 3) {
    return {
      id: 'evening_cluster',
      title: 'High Chance of Overload Around 5 PM',
      message: 'Multiple incidents frequently cluster between 4 PM and 6 PM. Consider scheduling a 10-minute quiet sensory break around 4:30 PM.',
      icon: 'clock-alert-outline',
    };
  }

  // Check morning routine cluster (7 AM - 9 AM: hours 7, 8)
  const morningCount = (hourCounts[7] || 0) + (hourCounts[8] || 0);
  if (morningCount >= 3) {
    return {
      id: 'morning_cluster',
      title: 'Morning Transition Pattern Detected',
      message: 'Mornings show frequent transition difficulties. Preparing clothes and visual schedules the night before may help smooth morning routines.',
      icon: 'weather-sunset-up',
    };
  }

  // 2. Check top trigger frequency
  const triggerCounts: Record<string, number> = {};
  incidents.forEach((inc) => {
    inc.triggers.forEach((trig) => {
      triggerCounts[trig] = (triggerCounts[trig] || 0) + 1;
    });
  });

  const sortedTriggers = Object.entries(triggerCounts).sort((a, b) => b[1] - a[1]);
  if (sortedTriggers.length > 0 && sortedTriggers[0][1] >= 3) {
    const topTrigger = sortedTriggers[0][0];
    return {
      id: 'top_trigger',
      title: `Frequent Trigger: ${topTrigger}`,
      message: `"${topTrigger}" is associated with ${sortedTriggers[0][1]} recorded incidents. Try introducing deep breathing or visual timers before this trigger occurs.`,
      icon: 'lightbulb-alert-outline',
    };
  }

  return null;
}
