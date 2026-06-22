import { TestResponse, QuestionVersion } from '@prisma/client';

interface GradingInput {
  response: TestResponse & { question: { versions: QuestionVersion[] } };
  marksCorrect: number;
  marksWrong: number;
}

export class GradingService {
  gradeResponse({ response, marksCorrect, marksWrong }: GradingInput) {
    const latestVersion = response.question.versions[0];
    if (!latestVersion) {
      return { isCorrect: false, marksAwarded: 0 };
    }

    const correctOptions = latestVersion.correctOptions.split(',').sort().join(',').trim();
    const userResponse = (response.responseValue || '').split(',').sort().join(',').trim();

    // Handle unattempted (no response value or status not ANSWERED/ANSWERED_REVIEW)
    if (!userResponse || (response.status !== 'ANSWERED' && response.status !== 'ANSWERED_REVIEW')) {
      return { isCorrect: false, marksAwarded: 0 };
    }

    const isCorrect = userResponse === correctOptions;
    const marksAwarded = isCorrect ? marksCorrect : -marksWrong;

    return { isCorrect, marksAwarded };
  }
}

export const gradingService = new GradingService();