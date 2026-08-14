import { describe, expect, it } from 'vitest';
import { buildWebsiteLeadPayload, type LandingBookingLeadData } from './leadPayload';

describe('buildWebsiteLeadPayload', () => {
  it('normalizes free-trial leads for the submit-lead function', () => {
    const lead: LandingBookingLeadData = {
      requestType: 'Free Trial',
      name: 'Aisha Student',
      whatsapp: '+201000000000',
      country: 'Egypt',
      age: 'Teenager',
      program: 'Quran Reading',
      programId: 'program-1',
      preferredTime: 'Evening',
      message: 'Please contact parent.',
      source: 'Musliman Academy Website',
    };

    expect(buildWebsiteLeadPayload(lead, false)).toEqual({
      full_name: 'Aisha Student',
      whatsapp: '+201000000000',
      country: 'Egypt',
      student_age: 'Teenager',
      program_id: 'program-1',
      program: 'Quran Reading',
      preferred_time: 'Evening',
      message: 'Please contact parent.',
      source: 'website',
      form_type: 'free_trial',
      lead_type: 'student',
    });
  });

  it('normalizes teacher-training leads without a student program id', () => {
    const lead: LandingBookingLeadData = {
      requestType: 'Teacher Training',
      name: 'Teacher Candidate',
      whatsapp: '+201000000001',
      country: 'Egypt',
      experience: 'Three plus years',
      qualification: 'Ijazah holder',
      trainingGoal: 'Online teaching',
      preferredTime: 'Morning',
      message: 'Interested in academy training.',
      source: 'Musliman Academy Website',
    };

    expect(buildWebsiteLeadPayload(lead, true)).toMatchObject({
      full_name: 'Teacher Candidate',
      program: 'Teacher Training',
      form_type: 'teacher_training',
      lead_type: 'teacher_training',
      program_id: undefined,
    });
    expect(buildWebsiteLeadPayload(lead, true).message).toContain('Experience: Three plus years');
  });
});
