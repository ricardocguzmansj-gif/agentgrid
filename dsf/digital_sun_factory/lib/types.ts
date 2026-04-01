export type ProductCard = {
  name: string;
  url: string;
  description: string;
};

export type VideoScene = {
  id: number;
  title: string;
  duration: string;
  objective: string;
  visual: string;
  script: string;
};

export type StrategyMilestone = {
  phase: string;
  goal: string;
  actions: string[];
  kpis: string[];
};
