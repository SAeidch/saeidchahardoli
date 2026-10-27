// Content for the Learn section: interactive teaching modules and recorded talks.
// The UI (home page "Learn & Talks" section and /learn) reads from here.

export type LearnModule = {
  slug: string;
  index: string;
  title: string;
  titleAccent: string; // the italic tail of the title
  blurb: string;
  tags: string[];
  minutes: number;
};

export const modules: LearnModule[] = [
  {
    slug: "transformers",
    index: "01",
    title: "Transformers,",
    titleAccent: "one matrix at a time",
    blurb:
      "A real Transformer running in your browser, small enough that every number is on screen. Follow one input through each matrix product, softmax and LayerNorm to a prediction, then watch backpropagation and Adam train all 227 weights. Built from the model in my M.S. defense.",
    tags: ["Linear algebra", "Self-attention", "Softmax", "Backprop", "Adam"],
    minutes: 30,
  },
];

export type Talk = {
  title: string;
  subtitle: string;
  kind: string;
  venue: string;
  date: string;
  href: string;
  blurb: string;
  tags: string[];
  note?: string;
};

export const talks: Talk[] = [
  {
    title: "M.S. Defense — Transfer Learning with a Transformer Adapter",
    subtitle:
      "for Personalized Thermal Comfort Prediction Using Wearable Heart Rate and Environmental Sensors",
    kind: "M.S. Computer Science · defense",
    venue: "Louisiana State University",
    date: "October 31, 2026",
    href: "/talks/ms-defense-transformer-adapter.html",
    blurb:
      "A Transformer (T3C) pretrained on 44,124 ASHRAE records, adapted to 596 local observations and three sensed signals with a small adapter. 73.3% accuracy against 67.8% for a BiLSTM adapter. Scroll-driven deck with an interactive 3D model of the network.",
    tags: ["Transformers", "Transfer learning", "Thermal comfort", "WebGL"],
  },
  {
    title: "Summer 2026 Data Science / AI Intern — Final Project Presentation",
    subtitle: "Your model felt fine right until it didn't: BIM model health at Hart Howerton",
    kind: "Industry · Design Technology",
    venue: "Hart Howerton",
    date: "August 5, 2026",
    href: "/talks/hart-howerton-summer-2026.html",
    blurb:
      "Nearly 350,000 Revit model saves across 449 projects, scored on 40 health checks. Change-point detection, a TabICL forecaster with a 4.5× lift over baseline, and a coaching loop that turns the findings into weekly training.",
    tags: ["Data science", "Forecasting", "BOCPD", "Azure"],
    note: "Public version: client project names are anonymized.",
  },
];
