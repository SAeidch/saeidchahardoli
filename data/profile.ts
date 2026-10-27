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
  availability: "Available Summer 2027 · Eligible for CPT/OPT work authorization",
  links: {
    github: "https://github.com/SAeidch",
    linkedin: "https://www.linkedin.com/in/saeid-chahardoli-278401173/",
    scholar: "https://scholar.google.com/citations?user=CAMi9GsAAAAJ&hl=en",
    cv: "/cv/Saeid-Chahardoli-CV.pdf",
    cvDocx: "/cv/Saeid-Chahardoli-CV.docx",
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
    title: "Deep Reinforcement Learning for Buildings",
    blurb:
      "PPO agents that calibrate CFD boundary conditions against live sensor streams, cutting manual calibration from hours to minutes per case, and ventilation policies that use less energy than rule-based control at equal occupant comfort.",
    tags: ["Reinforcement Learning", "PPO", "CFD Calibration", "HVAC"],
  },
  {
    index: "02",
    title: "Physics-Informed & Sequence Models",
    blurb:
      "Transformer and BiLSTM forecasters for indoor time series, transfer learning with a Transformer adapter, and physics-regularized Kolmogorov–Arnold surrogates that predict full concentration fields in real time (55 → 15 minutes per configuration).",
    tags: ["Transformers", "Transfer Learning", "KAN", "Surrogate Models"],
  },
  {
    index: "03",
    title: "Autonomous Mobile Sensing",
    blurb:
      "A custom ROS 2 mobile robot that logs CO₂, temperature, humidity and airflow with hardware time sync, SLAM and Nav2, steered by an uncertainty-driven active-learning loop that picks the next best place to measure.",
    tags: ["ROS 2", "SLAM", "Nav2", "Active Learning", "Sensor Fusion"],
  },
  {
    index: "04",
    title: "CFD, Bayesian Optimization & Comfort",
    blurb:
      "High-fidelity CFD of ventilation and particle dispersion validated against chamber data, combinatorial Bayesian optimization of air-purifier placement, and thermal-comfort models from IR imaging and wearable sensors.",
    tags: ["ANSYS Fluent", "Bayesian Optimization", "Thermal Comfort", "CFD"],
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
  url?: string;
};

// Author name emphasized in the UI:
export const AUTHOR_HIGHLIGHT = "Chahardoli";

// Selected list, newest first (35 indexed publications in total — see Google Scholar).
export const publications: Publication[] = [
  {
    authors: "Chahardoli, S., Mousavi, E., & Bhattacharya, A.",
    year: "Preprint",
    title:
      "Indoor Airflow Patterns for Random Occupant Movement Prediction Using an Event-Based Approach",
    venue: "SSRN preprint 6847975",
    url: "https://papers.ssrn.com/sol3/papers.cfm?abstract_id=6847975",
  },
  {
    authors: "Chahardoli, S., Lesan, M., Sarker, A., Navazani, M., & Bhattacharya, A.",
    year: "2026",
    title:
      "Real-Time CFD Model Calibration of an Environmental Chamber Using Deep Reinforcement Learning",
    venue: "ASHRAE Transactions, 132, 1233–1240",
  },
  {
    authors: "Chahardoli, S., Sedghikhanshir, A., Chen, Y., Zhu, Y., & Bhattacharya, A.",
    year: "2026",
    title:
      "Experimental and Numerical Analysis of Evaluating the Cooling Potential of a Green Wall in a Controlled Chamber",
    venue: "Building and Environment, art. 115119",
  },
  {
    authors: "Chahardoli, S., Sarker, A., Lesan, M., Xiao, Y., Johannsen, A. Z., & Bhattacharya, A.",
    year: "2026",
    title:
      "SIMOC-Inspired Mesh Sensing and Combinatorial Bayesian Optimization of Chamber Air-Purifier Placement",
    venue: "E3S Web of Conferences, 716, 01047",
  },
  {
    authors: "Sarker, A., Lesan, M., Chahardoli, S., & Bhattacharya, A.",
    year: "2026",
    title:
      "Real-Time Indoor CO₂ Distribution Prediction Using CFD and a Physics-Regularized Kolmogorov–Arnold Network",
    venue: "E3S Web of Conferences, 716, 01039",
  },
  {
    authors: "Xiao, Y., Chahardoli, S., Lesan, M., Sarker, A., Johannsen, A. Z., & Bhattacharya, A.",
    year: "2026",
    title:
      "Optimizing Ventilation Inlet and Outlet Configurations Using a UQ-Informed Robotic Sensing Platform",
    venue: "E3S Web of Conferences, 716, 01049",
  },
  {
    authors: "Chahardoli, S., Lesan, M., & Bhattacharya, A.",
    year: "2025",
    title:
      "A Reinforcement Learning-Based Ventilation Strategy for Occupant-Centric Thermal Comfort and Energy Efficiency",
    venue: "Computing in Civil Engineering 2025",
  },
  {
    authors: "Chahardoli, S., Zhu, Y., & Bhattacharya, A.",
    year: "2025",
    title: "Data-Driven Prediction of Thermal Comfort Using IR Imaging and Wearable Sensor Data",
    venue: "REHVA HVAC World Congress, 530–540",
  },
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
    period: "Jun — Aug 2026",
    title: "Data Scientist / AI Intern",
    org: "Hart Howerton, San Francisco, CA",
    detail:
      "Built and deployed a live BIM model-health platform on Azure from Revit telemetry (BIMbeats, Guardian, journal files, Autodesk Construction Cloud, Airtable), automated with GitHub Actions. Benchmarked seven walk-forward forecasters, including tabular foundation models (TabICL, TabPFN v2): the best reached 0.245 PR-AUC against a 0.054 baseline, a 4.5× lift across 871 project-months. Added a retrieval-augmented generation layer for weekly personalized Revit training.",
  },
  {
    period: "2023 — Present",
    title: "Graduate Research Assistant",
    org: "Louisiana State University",
    detail:
      "Deep RL (PPO) for real-time CFD calibration and ventilation control; active learning and Bayesian optimization for sensor placement; a custom ROS 2 mobile sensing robot; Transformer and BiLSTM forecasting with transfer learning; physics-regularized KAN surrogates; thermal-comfort models from IR imaging and wearables.",
  },
  {
    period: "2018 — Present",
    title: "Lecturer",
    org: "Various universities, Iran",
    detail: "Delivered 30+ technical sessions across multiple institutions.",
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
    title: "Ph.D. Candidate, Construction Management",
    org: "Louisiana State University",
    detail:
      "Deep reinforcement learning and DNN integration with EBM to predict indoor physical fields in real time. Coursework: deep learning, machine learning, reinforcement learning, Bayesian optimization, LLMs, agentic AI.",
  },
  {
    period: "2024 — 2026",
    title: "M.S., Computer Science",
    org: "Louisiana State University",
    detail:
      "Thesis: Transfer Learning with a Transformer Adapter for Personalized Thermal Comfort Prediction Using Sensors. Coursework: AI, machine learning, deep learning, agentic AI, LLMs (RAG).",
  },
  {
    period: "2017 — 2020",
    title: "M.S., Architectural Engineering",
    org: "Iran University of Science and Technology, Tehran",
    detail:
      "Thesis: Modeling particle dispersion around buildings using CFD.",
  },
  {
    period: "2013 — 2017",
    title: "B.S., Architectural Engineering",
    org: "Malayer University, Hamadan",
    detail: "Project: Research & simulation of houses' energy consumption.",
  },
];

export const skills: { group: string; items: string[] }[] = [
  { group: "Languages", items: ["Python", "TypeScript", "SQL", "C / C++", "MATLAB"] },
  {
    group: "ML & Deep Learning",
    items: [
      "PyTorch",
      "scikit-learn",
      "XGBoost",
      "Transformers",
      "RNN / LSTM",
      "Reinforcement Learning (PPO)",
      "Bayesian Optimization",
      "TabPFN v2 · TabICL",
      "KAN",
      "POD & Surrogate Models",
    ],
  },
  {
    group: "LLMs & Agents",
    items: ["RAG", "Agentic Workflows", "Vector Retrieval", "Prompt Engineering"],
  },
  {
    group: "Robotics",
    items: ["ROS 2", "SLAM", "Nav2", "Sensor Fusion", "LiDAR", "IR Camera"],
  },
  {
    group: "Data & Infrastructure",
    items: ["Pandas", "NumPy", "Elasticsearch", "SQL Server", "Azure", "GitHub Actions", "Docker", "Git", "Linux", "MQTT", "Jupyter"],
  },
  {
    group: "Simulation & Domain",
    items: ["ANSYS Fluent", "EnergyPlus", "CFD Post-processing", "Building Energy & HVAC Modeling"],
  },
];

export const honors: string[] = [
  "Scholarship award, IAQVEC Conference 2026, Los Angeles",
  "2nd place, poster presentation — Dept. of Construction Management, LSU (2025)",
  "Full tuition waiver, Iran University of Science and Technology — ranked top 0.25% nationally in the graduate entrance exam",
  "Top 5% in the national B.Sc. university entrance exam, Iran (2013)",
  "2nd prize, contemporary shelter design for post-natural disasters — Iranian Red Crescent",
];

export const stats: { value: string; label: string }[] = [
  { value: "35", label: "Indexed publications" },
  { value: "5", label: "h-index (Google Scholar)" },
  { value: "2", label: "M.S. degrees + Ph.D. in progress" },
];
