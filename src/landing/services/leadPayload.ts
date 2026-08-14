import type { WebsiteLeadPayload } from './websiteLeadService';

export type LandingBookingLeadData = Record<string, string | undefined> & {
  requestType: 'Free Trial' | 'Teacher Training';
  name: string;
  whatsapp: string;
  country: string;
  preferredTime: string;
  message: string;
  source: string;
};

export function buildWebsiteLeadPayload(leadData: LandingBookingLeadData, isTraining: boolean): WebsiteLeadPayload {
  const crmMessage = isTraining
    ? [
      leadData.experience ? `Experience: ${leadData.experience}` : '',
      leadData.qualification ? `Qualification: ${leadData.qualification}` : '',
      leadData.trainingGoal ? `Training goal: ${leadData.trainingGoal}` : '',
      leadData.message ? `Message: ${leadData.message}` : '',
    ].filter(Boolean).join('\n')
    : leadData.message;

  return {
    full_name: leadData.name,
    whatsapp: leadData.whatsapp,
    country: leadData.country,
    student_age: leadData.age || undefined,
    program_id: isTraining ? undefined : leadData.programId,
    program: isTraining ? 'Teacher Training' : leadData.program,
    preferred_time: leadData.preferredTime,
    message: crmMessage,
    source: 'website',
    form_type: isTraining ? 'teacher_training' : 'free_trial',
    lead_type: isTraining ? 'teacher_training' : 'student',
  };
}
