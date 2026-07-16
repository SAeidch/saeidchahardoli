// Central content for the site. Edit here — the UI reads from these typed structures.

export const profile = {
  name: "Saeid Chahardoli",
  // Guiding word for the brand mark / identity.
  mark: "Aerion",
  roles: ["AI & Robotics Researcher", "Data Scientist", "Architectural Engineer"],
  tagline:
    "Bridging artificial intelligence and the physics of the built environment.",
  intro:
    "I build intelligent systems — autonomous robots, deep-learning models, and physics-based simulations — that make the invisible flows of air, energy, and data inside our buildings visible, measurable, and controllable.",
  location: "Baton Rouge, Louisiana, USA",
  email: "schaha1@lsu.edu",
  phone: "+1 (225) 409-9216",
  links: {
    github: "https://github.com/SAeidch",
    scholar: "https://scholar.google.com/scholar?q=Saeid+Chahardoli",
    cv: "/cv/Saeid-Chahardoli-CV.docx",
  },
} as const;

export type ResearchArea = {
  index: string;
  title: string;
  blurb: string;
  tags: string[];
};

export const researchAreas: ResearchArea[] = [
  {
    index: "01",
    title: "AI for Indoor Air Quality & HVAC",
    blurb:
      "Optimizing indoor air quality and HVAC systems with AI and robots. Reinforcement-learning policies (PPO) trade off ventilation, comfort, and energy against measured baselines.",
    tags: ["Reinforcement Learning", "HVAC", "IAQ", "Optimization"],
  },
  {
    index: "02",
    title: "Physics-Informed Machine Learning",
    blurb:
      "Predicting airflow distribution by combining Explainable Boosting Machines and deep learning with CFD-grounded features — fast surrogates for slow simulations.",
    tags: ["EBM", "Transformers", "RNNs", "Surrogate Models"],
  },
  {
    index: "03",
    title: "Autonomous Mobile Sensing",
    blurb:
      "A custom ROS 2 mobile robot that logs CO₂, temperature, humidity and airflow with time-sync and mapping — enabling repeatable indoor air-quality surveys across zones.",
    tags: ["ROS 2", "SLAM", "Nav2", "LiDAR", "Sensor Fusion"],
  },
  {
    index: "04",
    title: "CFD & Building Physics",
    blurb:
      "High-fidelity computational fluid dynamics of particle dispersion, ventilation, and thermal comfort — validated against sensor data from real indoor environments.",
    tags: ["ANSYS Fluent", "CFD", "Ventilation", "Dispersion"],
  },
];

/* ───────────────────────── Robot: field build ─────────────────────────
   The autonomous air-quality robot. Content-only; the <Robot /> component
   renders it. Hotspot x/y are percentages over public/robot/robot.jpg. */

export type Hotspot = {
  id: string;
  x: number; // % from left
  y: number; // % from top
  label: string;
  detail: string;
};

export type PipelineStep = {
  step: string;
  title: string;
  blurb: string;
};

export const robot = {
  eyebrow: "Field build · Robot-in-the-loop",
  title: "The air-quality robot",
  tagline:
    "An autonomous robot I designed and built to map the air you can't see — and trace pollution back to its source.",
  intro:
    "Fixed air-quality sensors are blind between the dots. So I built a mobile one: a hand-wired robot that drives itself through a room on LiDAR-SLAM, samples CO₂ and PM₂.₅ every two seconds, and fuses those readings into a live map of the invisible. A single robot becomes a whole virtual sensor grid — and then climbs the concentration gradient to find where the pollution is coming from.",

  // Callout tuned to the GenAI / builder audience.
  pitch:
    "It's a closed perception–decision–action loop running on real hardware: sense → localize → fuse → decide where to look next. One self-calibrating robot replaces a rack of fixed sensors, and lays the groundwork for multi-robot cooperative sensing and AI-driven ventilation control.",

  image: "/robot/robot.jpg",
  imageAlt:
    "Custom two-deck mobile robot with a top-mounted LiDAR, air-quality sensor boards, and omnidirectional wheels",

  hotspots: [
    {
      id: "lidar",
      x: 52,
      y: 16,
      label: "2D LiDAR",
      detail:
        "Spinning laser scanner that builds the map and localizes the robot in real time (SLAM) — every air reading gets an accurate x, y position.",
    },
    {
      id: "sensors",
      x: 30,
      y: 33,
      label: "Multi-pollutant sensors",
      detail:
        "CO₂, PM₂.₅, temperature and relative humidity, sampled every 2 seconds for high-temporal-resolution monitoring.",
    },
    {
      id: "compute",
      x: 46,
      y: 55,
      label: "Raspberry Pi + Arduino",
      detail:
        "Raspberry Pi runs ROS 2, SLAM and the sensing pipeline; an Arduino handles low-level motor control and sensor I/O.",
    },
    {
      id: "power",
      x: 66,
      y: 60,
      label: "Battery + motor drivers",
      detail:
        "Onboard LiPo power and motor drivers make the platform fully untethered for autonomous surveys.",
    },
    {
      id: "wheels",
      x: 44,
      y: 84,
      label: "Omni-drive wheels",
      detail:
        "Omnidirectional wheels let the robot hold heading while translating in any direction — smooth, repeatable traverses across the grid.",
    },
  ] as Hotspot[],

  pipeline: [
    {
      step: "01",
      title: "Sense",
      blurb:
        "CO₂, PM₂.₅, temperature and humidity streamed every 2 s — each reading timestamped at the source.",
    },
    {
      step: "02",
      title: "Localize",
      blurb:
        "2D LiDAR SLAM maps the room and position-tags every measurement, turning a moving robot into a dense grid of virtual sensors.",
    },
    {
      step: "03",
      title: "Fuse",
      blurb:
        "Kalman filtering and inverse-distance weighting smooth the sparse trajectory into a continuous, room-wide pollutant field.",
    },
    {
      step: "04",
      title: "Locate",
      blurb:
        "Gradient-ascent search climbs the reconstructed field to the emission source — pinned to within ~0.74 m of the true location.",
    },
  ] as PipelineStep[],

  stats: [
    { value: "0.74 m", label: "source located within" },
    { value: "2 s", label: "sampling cadence" },
    { value: "4", label: "signals — CO₂ · PM₂.₅ · temp · RH" },
    { value: "24→1", label: "fixed-sensor grid replaced by one robot" },
  ],

  stack: [
    { group: "Compute", items: ["Raspberry Pi", "Arduino", "ROS 2"] },
    { group: "Perception", items: ["2D LiDAR", "SLAM", "Occupancy Mapping"] },
    {
      group: "Air sensing",
      items: ["CO₂ (NDIR)", "PM₂.₅ (laser)", "Temp", "Humidity"],
    },
    {
      group: "Algorithms",
      items: [
        "Kalman Filter",
        "Inverse-Distance Weighting",
        "Gradient-Ascent Source Localization",
        "Adaptive Sampling",
      ],
    },
    { group: "Mobility", items: ["Omni-drive", "DC motors", "Untethered"] },
    { group: "Software", items: ["Python", "Semantic Mapping", "Sensor Fusion"] },
  ],

  gallery: [
    {
      src: "/robot/chamber-setup.jpeg",
      alt: "Diagram of the controlled test chamber with ventilation inlet and outlet, the robot, and a wall sensor",
      caption:
        "Controlled test chamber (3.2 × 4.2 × 2.45 m) with steady inlet/outlet ventilation — where the robot and fixed sensors were validated against a known smoke source.",
    },
    {
      src: "/robot/sensor-grid.png",
      alt: "2D grid of 6 columns by 4 rows of measurement points with a smoke generator marked",
      caption:
        "The virtual measurement grid: 24 points at 60 cm spacing across three heights, with a smoke generator as a ground-truth pollution source.",
    },
  ],

  paper: {
    title:
      "Robot-in-the-Loop Indoor Air Quality Mapping and Source Localization Using LiDAR-SLAM and Multi-Pollutant Sensing",
    authors:
      "Chahardoli, S., Sarker, A., Lesan, M., Xiao, Y., & Bhattacharya, A.",
    venue: "Indoor Air 2026 (forthcoming)",
  },
} as const;

export type Publication = {
  authors: string;
  year: string;
  title: string;
  venue: string;
  doi?: string;
};

// Author name emphasized in the UI:
export const AUTHOR_HIGHLIGHT = "Chahardoli";

export const publications: Publication[] = [
  {
    authors: "Chahardoli, S., Nikoopayan Tak, M. S., Lesan, M., Mousavi, E., & Bhattacharya, A.",
    year: "2025",
    title:
      "Analysis of the Effects of a Swing Door Opening on Indoor Airflow Fields — An Experimental Study",
    venue: "Buildings, 16(1), 54",
  },
  {
    authors: "Lesan, M., Chahardoli, S., & Bhattacharya, A.",
    year: "2025",
    title:
      "The Synergy of Ventilation System Layouts and Occupant Arrangements on Ventilation Effectiveness: A Case Study in a Shared Office",
    venue: "Buildings",
    doi: "10.3390/buildings15213914",
  },
  {
    authors: "Chahardoli, S., & Lesan, M.",
    year: "2024",
    title:
      "The Effects of Diffuser Location on Ventilated Airflow — A Numerical Simulation Study",
    venue: "ASHRAE Transactions, 130, 775–783",
  },
  {
    authors: "Khakzand, M., Deljouiee, B., Chahardoli, S., & Siavashi, M.",
    year: "2024",
    title:
      "Radiative Cooling Ventilation Improvement Using an Integrated System of Windcatcher and Solar Chimney",
    venue: "Journal of Building Engineering",
    doi: "10.1016/j.jobe.2023.108409",
  },
  {
    authors: "Farhadi, F., Khakzand, M., Altan, H., & Chahardoli, S.",
    year: "2023",
    title:
      "The Relationship Between IAQ (CO, CO₂, PM2.5, PM10), Air Outlet Location and Emission Behavior in Healthcare Facilities (Namazi Hospital, Shiraz)",
    venue: "International Journal of Ventilation",
    doi: "10.1080/14733315.2023.2198743",
  },
  {
    authors: "Farhadi, F., Chahardoli, S., & Khakzand, M.",
    year: "2023",
    title:
      "Indoor Air Quality in Health Care Units (Case Study: Namazi Hospital, Shiraz, Iran)",
    venue: "IntechOpen",
    doi: "10.5772/intechopen.113724",
  },
  {
    authors: "Chahardoli, S., Khakzand, M., Faizi, M., & Siavashi, M.",
    year: "2022",
    title:
      "Numerical Analysis of the Effect of Roof Types and Porch on Particle Dispersion and Deposition Around a Low-Rise Building",
    venue: "Journal of Building Engineering, 53, 104533",
  },
  {
    authors: "Khakzand, M., Chahardoli, S., Niknejad, A., & Khanijazani, T.",
    year: "2022",
    title:
      "Comparative Study of Architectural Elements to Improve the Wind Environment in Hot and Humid Climates",
    venue: "Journal of Design and Built Environment",
  },
  {
    authors: "Khakzand, M., & Chahardoli, S.",
    year: "2021",
    title:
      "Indoor Thermal Comfort and High Residential Buildings (Case Study: Two High-Rise Buildings in Tehran)",
    venue: "Journal of Urban Management and Energy Sustainability (JUMES)",
    doi: "10.22034/JUMES.2021.553631.1075",
  },
];

export type TimelineItem = {
  period: string;
  title: string;
  org: string;
  detail: string;
};

export const experience: TimelineItem[] = [
  {
    period: "2026",
    title: "Data Scientist / AI Intern",
    org: "Hart Howerton",
    detail:
      "Applying data science, machine learning, and AI to design, planning, and analytics workflows at a leading planning, architecture, and landscape architecture firm.",
  },
  {
    period: "2023 — Present",
    title: "Graduate Research Assistant",
    org: "Dept. of Construction Management, Louisiana State University",
    detail:
      "Built a ROS-based mobile sensing pipeline; trained Transformer/RNN forecasting and PPO control policies; ran CFD studies validated against sensor data.",
  },
  {
    period: "2018 — Present",
    title: "Lecturer",
    org: "Various Universities",
    detail:
      "Delivered complex technical coursework across 30+ sessions at multiple institutions.",
  },
  {
    period: "2017 — 2018",
    title: "Project Management Intern",
    org: "Pahneh Band Consulting Engineers, Tehran",
    detail: "Participated in all phases of design and construction.",
  },
];

export const education: TimelineItem[] = [
  {
    period: "2023 — Present",
    title: "Ph.D., Construction Management",
    org: "Louisiana State University",
    detail:
      "Optimizing Indoor Air Quality and HVAC Systems using AI and Robots.",
  },
  {
    period: "2024 — 2026",
    title: "M.Sc., Computer Science",
    org: "Louisiana State University",
    detail: "Thesis: Prediction of Airflow Distribution using EBM and AI.",
  },
  {
    period: "2017 — 2020",
    title: "M.Sc., Architectural Engineering",
    org: "Iran University of Science and Technology, Tehran",
    detail:
      "Thesis: Modeling particle dispersion around buildings using CFD.",
  },
  {
    period: "2013 — 2017",
    title: "B.Sc., Architectural Engineering",
    org: "Malayer University",
    detail: "Project: Research & simulation of houses' energy consumption.",
  },
];

export const skills: { group: string; items: string[] }[] = [
  { group: "Programming", items: ["Python", "SQL", "C / C++"] },
  {
    group: "ML & Data",
    items: ["PyTorch", "scikit-learn", "XGBoost", "Pandas", "NumPy", "Time-Series"],
  },
  {
    group: "AI & LLMs",
    items: ["Deep Learning", "Transformers", "RNNs", "Reinforcement Learning", "RAG"],
  },
  {
    group: "Robotics",
    items: ["ROS / ROS 2", "SLAM", "Nav2", "LiDAR", "Sensor Fusion", "MQTT"],
  },
  {
    group: "Simulation",
    items: ["ANSYS Fluent", "MATLAB", "EnergyPlus", "CFD"],
  },
  { group: "Tooling", items: ["Git", "Linux", "Docker", "Jupyter"] },
];

export const honors: string[] = [
  "2nd place, poster presentation — Dept. of Construction Management, LSU (2025)",
  "Tuition fee waiver, Iran University of Science and Technology — top 0.25% in the national master's entrance exam",
  "Top 5% in the national B.Sc. university entrance exam, Iran (2013)",
  "2nd prize, contemporary shelter design for post-natural disasters — Iranian Red Crescent",
];

export const stats: { value: string; label: string }[] = [
  { value: "9+", label: "Peer-reviewed publications" },
  { value: "2", label: "M.Sc. degrees + Ph.D. in progress" },
  { value: "10+", label: "Years across research & practice" },
];
