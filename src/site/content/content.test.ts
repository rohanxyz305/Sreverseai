import { describe, expect, it } from 'vitest';
import campaignIndex from '../../games/grafana/levels/index.json';
import practiceIndex from '../../games/grafana/levels/practice/index.json';
import { BASE } from '../../games/grafana/paths';
import { GAMES } from '../../games/registry';
import { GLOSSARY } from './glossary';
import { LESSONS } from './lessons';

describe('site content', () => {
  it('lesson slugs are unique and every lesson has content', () => {
    expect(new Set(LESSONS.map((l) => l.slug)).size).toBe(LESSONS.length);
    for (const l of LESSONS) {
      expect(l.sections.length, l.slug).toBeGreaterThan(0);
      expect(l.takeaways.length, l.slug).toBeGreaterThan(0);
    }
  });

  it('both tracks have lessons', () => {
    expect(LESSONS.some((l) => l.track === 'beginner')).toBe(true);
    expect(LESSONS.some((l) => l.track === 'experienced')).toBe(true);
  });

  it('practice links point at playable game levels', () => {
    const campaign = new Set(campaignIndex.chapters.flatMap((c) => c.levels.filter((l) => 'file' in l).map((l) => l.id)));
    const practice = new Set(practiceIndex.challenges.map((c) => c.id));
    for (const l of LESSONS) {
      if (!l.practice) continue;
      const m = new RegExp(`^${BASE}/(play|practice)/(\\d+)$`).exec(l.practice.to);
      expect(m, `${l.slug}: ${l.practice.to}`).not.toBeNull();
      const id = Number(m![2]);
      expect((m![1] === 'play' ? campaign : practice).has(id), `${l.slug} -> ${l.practice.to}`).toBe(true);
    }
  });

  it('glossary terms are unique and link to real lessons', () => {
    expect(new Set(GLOSSARY.map((t) => t.term)).size).toBe(GLOSSARY.length);
    const slugs = new Set(LESSONS.map((l) => l.slug));
    for (const t of GLOSSARY) if (t.lesson) expect(slugs.has(t.lesson), t.term).toBe(true);
  });

  it('every live game has a component, and fullscreen paths match its slug', () => {
    for (const g of GAMES.filter((x) => x.status === 'live')) {
      expect(g.component, g.slug).toBeDefined();
      if (g.fullscreen) expect(g.fullscreen.test(`/games/${g.slug}/play/1`) || g.fullscreen.test(`/games/${g.slug}/practice/1`)).toBe(true);
    }
  });
});
