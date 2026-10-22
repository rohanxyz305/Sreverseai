import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';

interface LearnState {
  completed: string[];
  toggle: (slug: string) => void;
}

/** Lesson completion, kept in this browser only. */
export const useLearn = create<LearnState>()(
  persist(
    (set, get) => ({
      completed: [],
      toggle: (slug) => {
        const c = get().completed;
        set({ completed: c.includes(slug) ? c.filter((s) => s !== slug) : [...c, slug] });
      },
    }),
    { name: 'sreverseai-learn', storage: createJSONStorage(() => localStorage), version: 1 },
  ),
);
