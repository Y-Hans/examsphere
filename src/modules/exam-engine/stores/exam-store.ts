import { create } from 'zustand';
import { TestSession, TestResponse } from '@prisma/client';

interface ExamState {
  session: TestSession | null;
  responses: TestResponse[];
  currentSectionIndex: number;
  currentQuestionIndex: number;
  timeRemaining: number; // in seconds
  status: 'NOT_STARTED' | 'IN_PROGRESS' | 'SUBMITTED';
  
  initExam: (session: TestSession, responses: TestResponse[], durationMin: number) => void;
  setCurrentQuestion: (sectionIndex: number, questionIndex: number) => void;
  updateResponse: (questionId: string, responseValue: string, status: TestResponse['status']) => void;
  tick: () => void;
  submit: () => void;
}

export const useExamStore = create<ExamState>((set, get) => ({
  session: null,
  responses: [],
  currentSectionIndex: 0,
  currentQuestionIndex: 0,
  timeRemaining: 0,
  status: 'NOT_STARTED',

  initExam: (session, responses, durationMin) => {
    set({
      session,
      responses,
      status: 'IN_PROGRESS',
      timeRemaining: durationMin * 60,
      currentSectionIndex: 0,
      currentQuestionIndex: 0,
    });
  },

  setCurrentQuestion: (sectionIndex, questionIndex) => {
    set({ currentSectionIndex: sectionIndex, currentQuestionIndex: questionIndex });
  },

  updateResponse: (questionId, responseValue, status) => {
    set((state) => ({
      responses: state.responses.map((r) =>
        r.questionId === questionId
          ? { ...r, responseValue, status }
          : r
      ),
    }));
  },

  tick: () => {
    const { timeRemaining, status } = get();
    if (status === 'IN_PROGRESS' && timeRemaining > 0) {
      set({ timeRemaining: timeRemaining - 1 });
    } else if (timeRemaining <= 0 && status === 'IN_PROGRESS') {
      set({ status: 'SUBMITTED' });
    }
  },

  submit: () => {
    set({ status: 'SUBMITTED' });
  },
}));