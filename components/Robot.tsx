"use client";

import { useState } from "react";
import Image from "next/image";
import { motion } from "framer-motion";
import Reveal from "@/components/Reveal";
import { robot } from "@/data/profile";

export default function Robot() {
  // Which hardware hotspot is currently expanded. Defaults to the LiDAR.
  const [active, setActive] = useState<string>(robot.hotspots[0].id);
  const activeSpot =
    robot.hotspots.find((h) => h.id === active) ?? robot.hotspots[0];

  return (
    <section
      id="robot"
      className="relative border-t border-ink/10 bg-paper/60 px-6 py-28 backdrop-blur-sm"
    >
      <div className="mx-auto max-w-6xl">
        {/* Heading */}
        <Reveal>
          <p className="section-label mb-3">03 / Robotics</p>
          <h2 className="display mb-5 text-5xl text-ink sm:text-6xl">
            {robot.title.split(" ").slice(0, -1).join(" ")}{" "}
            <span className="italic text-accent">
              {robot.title.split(" ").slice(-1)}
            </span>
          </h2>
          <p className="max-w-2xl text-lg leading-relaxed text-ink/80">
            {robot.tagline}
          </p>
        </Reveal>

        {/* Annotated robot + spec readout */}
        <div className="mt-16 grid items-center gap-10 lg:grid-cols-[1.15fr_1fr]">
          <Reveal>
            <figure className="relative overflow-hidden rounded-2xl border border-ink/10 bg-paper blueprint-grid">
              <Image
                src={robot.image}
                alt={robot.imageAlt}
                width={1500}
                height={1083}
                className="h-auto w-full select-none"
                priority={false}
              />
              {/* Interactive hardware hotspots */}
              {robot.hotspots.map((h, i) => {
                const isActive = h.id === active;
                return (
                  <button
                    key={h.id}
                    type="button"
                    onClick={() => setActive(h.id)}
                    onMouseEnter={() => setActive(h.id)}
                    aria-label={h.label}
                    className="group absolute -translate-x-1/2 -translate-y-1/2"
                    style={{ left: `${h.x}%`, top: `${h.y}%` }}
                  >
                    <span
                      className={`flex h-7 w-7 items-center justify-center rounded-full border font-mono text-[0.7rem] transition-all ${
                        isActive
                          ? "scale-110 border-accent bg-accent text-paper shadow-lg"
                          : "border-accent/60 bg-paper/80 text-accent backdrop-blur-sm hover:border-accent"
                      }`}
                    >
                      {i + 1}
                    </span>
                    {isActive && (
                      <span className="absolute inset-0 -z-10 animate-ping rounded-full bg-accent/40" />
                    )}
                  </button>
                );
              })}
            </figure>
          </Reveal>

          <Reveal delay={0.1}>
            <div>
              <p className="text-ink/80">{robot.intro}</p>

              {/* Selected-part readout */}
              <div className="mt-8 rounded-xl border border-ink/10 bg-paper p-6">
                <motion.div
                  key={activeSpot.id}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
                >
                  <span className="section-label !text-accent">
                    {String(robot.hotspots.indexOf(activeSpot) + 1).padStart(
                      2,
                      "0"
                    )}{" "}
                    / {activeSpot.label}
                  </span>
                  <p className="mt-3 text-sm leading-relaxed text-ink/70">
                    {activeSpot.detail}
                  </p>
                </motion.div>
                <ul className="mt-5 flex flex-wrap gap-2">
                  {robot.hotspots.map((h, i) => (
                    <li key={h.id}>
                      <button
                        type="button"
                        onClick={() => setActive(h.id)}
                        className={`rounded-full border px-3 py-1 font-mono text-[0.7rem] uppercase tracking-wider transition-colors ${
                          h.id === active
                            ? "border-accent bg-accent/10 text-accent"
                            : "border-ink/15 text-ink/60 hover:border-accent hover:text-accent"
                        }`}
                      >
                        {i + 1} · {h.label}
                      </button>
                    </li>
                  ))}
                </ul>
              </div>
              <p className="mt-4 text-center font-mono text-[0.7rem] uppercase tracking-wider text-ink/40 lg:text-left">
                Tap a marker to inspect the build
              </p>
            </div>
          </Reveal>
        </div>

        {/* Stats */}
        <div className="mt-20 grid grid-cols-2 gap-6 lg:grid-cols-4">
          {robot.stats.map((s, i) => (
            <Reveal key={s.label} delay={i * 0.05}>
              <div className="border-l border-accent/40 pl-4">
                <div className="display text-4xl text-accent sm:text-5xl">
                  {s.value}
                </div>
                <div className="mt-2 text-sm text-ink/60">{s.label}</div>
              </div>
            </Reveal>
          ))}
        </div>

        {/* Pipeline — the robot-in-the-loop */}
        <div className="mt-24">
          <Reveal>
            <h3 className="display mb-3 text-3xl text-ink">
              A closed loop, on real hardware
            </h3>
            <p className="mb-10 max-w-2xl text-ink/70">{robot.pitch}</p>
          </Reveal>
          <div className="grid gap-px overflow-hidden rounded-2xl border border-ink/10 bg-ink/10 sm:grid-cols-2 lg:grid-cols-4">
            {robot.pipeline.map((p, i) => (
              <Reveal key={p.step} delay={i * 0.06}>
                <article className="group h-full bg-paper p-7 transition-colors hover:bg-paper/40">
                  <span className="display text-4xl text-ink/15 transition-colors group-hover:text-accent/40">
                    {p.step}
                  </span>
                  <h4 className="display mt-4 text-xl text-ink">{p.title}</h4>
                  <p className="mt-3 text-sm leading-relaxed text-ink/70">
                    {p.blurb}
                  </p>
                </article>
              </Reveal>
            ))}
          </div>
        </div>

        {/* Stack */}
        <div className="mt-20 grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
          {robot.stack.map((s, i) => (
            <Reveal key={s.group} delay={i * 0.05}>
              <div>
                <h4 className="section-label mb-3 !text-accent">{s.group}</h4>
                <ul className="flex flex-wrap gap-2">
                  {s.items.map((item) => (
                    <li
                      key={item}
                      className="rounded-full border border-ink/15 px-3 py-1 text-sm text-ink/75"
                    >
                      {item}
                    </li>
                  ))}
                </ul>
              </div>
            </Reveal>
          ))}
        </div>

        {/* Validation gallery */}
        <div className="mt-24 grid gap-8 md:grid-cols-2">
          {robot.gallery.map((g, i) => (
            <Reveal key={g.src} delay={i * 0.08}>
              <figure className="overflow-hidden rounded-2xl border border-ink/10 bg-paper">
                <div className="flex items-center justify-center bg-white p-4">
                  <Image
                    src={g.src}
                    alt={g.alt}
                    width={1200}
                    height={760}
                    className="h-auto w-full"
                  />
                </div>
                <figcaption className="border-t border-ink/10 p-5 text-sm text-ink/65">
                  {g.caption}
                </figcaption>
              </figure>
            </Reveal>
          ))}
        </div>

        {/* Paper reference */}
        <Reveal>
          <div className="mt-16 rounded-2xl border border-ink/10 bg-ink px-7 py-8 text-paper">
            <span className="section-label !text-paper/50">
              Forthcoming publication
            </span>
            <h4 className="mt-3 max-w-3xl text-lg leading-snug text-paper sm:text-xl">
              {robot.paper.title}
            </h4>
            <p className="mt-3 text-sm text-paper/60">{robot.paper.authors}</p>
            <p className="mt-1 font-mono text-xs uppercase tracking-wider text-accent">
              {robot.paper.venue}
            </p>
          </div>
        </Reveal>
      </div>
    </section>
  );
}
