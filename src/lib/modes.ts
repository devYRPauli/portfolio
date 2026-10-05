/** The three groups work sits in, on the home page and on /work/. */
export const modes = {
  build: {
    label: 'Things I build',
    lede: 'I built or led these, at UF and on my own time.',
  },
  evaluate: {
    label: 'Things I evaluate',
    lede: 'I test new models and inference stacks on my own hardware and publish what I measure.',
  },
  football: {
    label: 'Football',
    lede: 'I follow seven football competitions, so I built a dashboard for them behind a caching proxy. I also built a prediction pool and ran it through the 2026 World Cup.',
  },
} as const;

export type Mode = keyof typeof modes;
