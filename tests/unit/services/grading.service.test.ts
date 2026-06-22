import { GradingService } from '@/modules/exam-engine/services/grading.service';

describe('GradingService', () => {
  let service: GradingService;

  beforeEach(() => {
    service = new GradingService();
  });

  it('should award full marks for a correct single choice answer', () => {
    const mockResponse: any = {
      responseValue: 'A',
      status: 'ANSWERED',
      question: {
        versions: [{ correctOptions: 'A' }],
      },
    };

    const result = service.gradeResponse({ response: mockResponse, marksCorrect: 4, marksWrong: 1 });
    expect(result.isCorrect).toBe(true);
    expect(result.marksAwarded).toBe(4);
  });

  it('should apply negative marks for an incorrect single choice answer', () => {
    const mockResponse: any = {
      responseValue: 'B',
      status: 'ANSWERED',
      question: {
        versions: [{ correctOptions: 'A' }],
      },
    };

    const result = service.gradeResponse({ response: mockResponse, marksCorrect: 4, marksWrong: 1 });
    expect(result.isCorrect).toBe(false);
    expect(result.marksAwarded).toBe(-1);
  });

  it('should award zero marks for an unattempted question', () => {
    const mockResponse: any = {
      responseValue: null,
      status: 'VISITED',
      question: {
        versions: [{ correctOptions: 'A' }],
      },
    };

    const result = service.gradeResponse({ response: mockResponse, marksCorrect: 4, marksWrong: 1 });
    expect(result.isCorrect).toBe(false);
    expect(result.marksAwarded).toBe(0);
  });

  it('should handle multiple correct options (MCQ) regardless of order', () => {
    const mockResponse: any = {
      responseValue: 'A,C',
      status: 'ANSWERED',
      question: {
        versions: [{ correctOptions: 'C,A' }],
      },
    };

    const result = service.gradeResponse({ response: mockResponse, marksCorrect: 4, marksWrong: 1 });
    expect(result.isCorrect).toBe(true);
    expect(result.marksAwarded).toBe(4);
  });

  it('should mark incorrect if only partial correct options are provided for MCQ', () => {
    const mockResponse: any = {
      responseValue: 'A',
      status: 'ANSWERED',
      question: {
        versions: [{ correctOptions: 'A,C' }],
      },
    };

    const result = service.gradeResponse({ response: mockResponse, marksCorrect: 4, marksWrong: 1 });
    expect(result.isCorrect).toBe(false);
    expect(result.marksAwarded).toBe(-1);
  });
});