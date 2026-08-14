import { describe, expect, it } from 'vitest';
import { getNextClass, type ClassScheduleRow } from './classSchedulesService';

function schedule(overrides: Partial<ClassScheduleRow>): ClassScheduleRow {
  return {
    id: 'schedule-1',
    student_id: 'student-1',
    program_id: null,
    teacher_profile_id: 'teacher-profile-1',
    day_of_week: 'Monday',
    start_time: '17:00:00',
    duration_minutes: 30,
    timezone: 'Africa/Cairo',
    platform: 'Zoom',
    meeting_link: null,
    status: 'active',
    ...overrides,
  };
}

describe('getNextClass', () => {
  it('ignores archived schedule rows', () => {
    expect(getNextClass([schedule({ status: 'archived' })])).toBeNull();
  });

  it('returns a display label for the nearest active schedule', () => {
    const next = getNextClass([
      schedule({ id: 'late', day_of_week: 'Saturday', start_time: '23:00:00' }),
      schedule({ id: 'early', day_of_week: 'Monday', start_time: '05:00:00' }),
    ]);

    expect(next?.label).toMatch(/Monday|Saturday/);
    expect(next?.row.status).toBe('active');
  });
});
