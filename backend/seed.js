import "dotenv/config";
import bcrypt from "bcryptjs";
import { randomUUID } from "node:crypto";
import { getSupabase, unwrap } from "./src/config/db.js";

const email = process.env.ADMIN_EMAIL?.trim().toLowerCase();
const password = process.env.ADMIN_PASSWORD;
if (!email || !password || password.length < 8) {
  throw new Error("Set ADMIN_EMAIL and an ADMIN_PASSWORD of at least 8 characters in backend/.env before seeding.");
}

const passwordHash = await bcrypt.hash(password, 10);
const admin = unwrap(await getSupabase()
  .from("users")
  .upsert({
    name: "Administrator",
    email,
    password_hash: passwordHash,
    role: "admin",
    updated_at: new Date().toISOString(),
  }, { onConflict: "email" })
  .select("id, email")
  .single());

console.log(`Admin account ready for ${admin.email}.`);

const categories = [
  ["Artificial Intelligence", "AI research, products, automation, and responsible adoption."],
  ["Technology", "Software, hardware, platforms, and the systems shaping modern life."],
  ["Product Design", "Interfaces, design systems, research, and user-centered products."],
  ["Software Engineering", "Programming, architecture, developer tools, and engineering practice."],
  ["Future of Work", "How technology is changing teams, careers, and workplaces."],
  ["Cybersecurity", "Security strategy, privacy, threat intelligence, and digital trust."],
  ["Startups", "Founder lessons, business strategy, growth, and new ventures."],
  ["Culture", "The human stories, habits, and ideas behind technological change."],
];

await getSupabase().from("categories").upsert(
  categories.map(([name, description]) => ({ name, description })),
  { onConflict: "name" }
);

const aiPost = {
  title: "How Artificial Intelligence Is Reshaping the Tech Industry in 2026",
  slug: "how-artificial-intelligence-is-reshaping-tech-2026",
  category: "Artificial Intelligence",
  tags: ["AI", "Technology", "Future of Work", "Innovation"],
  cover_image: "https://images.unsplash.com/photo-1677442136019-21780ecad995?auto=format&fit=crop&w=1600&q=85",
  excerpt: "AI is moving from experimental feature to industry infrastructure—changing software teams, product strategy, cybersecurity, and the skills organizations value.",
  status: "published",
  meta_title: "AI's Impact on the Tech Industry in 2026",
  meta_description: "A practical look at how AI is changing software, work, cybersecurity, product design, and technology careers in 2026.",
  author_id: admin.id,
  content: `Artificial intelligence is no longer just a headline feature added to a product. In 2026, it is becoming part of the underlying infrastructure of the technology industry.

## From tools to collaborators

The clearest change is that AI has moved beyond answering isolated questions. Developers now use coding agents to explore codebases, generate tests, refactor repetitive sections, and document unfamiliar systems. Designers use generative tools for research synthesis and rapid interface exploration. Support teams use retrieval-based assistants to answer questions from approved company knowledge.

The important distinction is that the best systems do not replace human judgment. They shorten the distance between an idea and an informed decision. The engineer still owns the architecture, the reviewer still validates correctness, and the domain expert remains responsible for context.

## Product teams are being redesigned

Traditional product workflows are also becoming more fluid. A small team can prototype several interactions in hours, summarize user interviews faster, and translate customer feedback into testable hypotheses. This lowers the cost of exploration.

However, speed creates a new responsibility: products must be useful before they are merely impressive. Teams need clear evaluation criteria, measurable outcomes, human oversight, and graceful ways to correct mistakes. The most durable AI products are not the ones that talk the most—they are the ones that help users complete meaningful tasks with less friction.

## Work is changing in layers

AI is changing work unevenly. Routine tasks with predictable structure are increasingly automated, while roles focused on judgment, relationship-building, systems thinking, and creative direction are gaining importance. Technical professionals now spend more time evaluating generated work, designing guardrails, and connecting systems than writing every line from scratch.

This does not mean every job stays the same. It means the skill mix is shifting. Communication, domain knowledge, critical thinking, security awareness, and the ability to verify AI output are becoming core professional skills—not optional extras.

## Security and trust matter more

As AI systems handle sensitive data and influence decisions, security becomes a product feature rather than a final checklist. Organizations need to control prompts, model access, connected data sources, and agent permissions. They also need audit trails, rate limits, testing for prompt injection, and policies for data retention.

Trust will increasingly depend on transparency: users should know when they are interacting with AI, why a result was produced, and when a person will review it. Confidence without evidence is not a reliable product standard.

## What technology leaders should prioritize

The organizations gaining lasting value from AI tend to follow a practical strategy:

- Start with a real workflow and a measurable bottleneck.
- Use small, focused pilots before broad transformation.
- Invest in clean data and reliable internal knowledge.
- Treat output verification as a required step.
- Give employees permission to learn and experiment.
- Measure business results, not only generated content.
- Build governance into the product from the beginning.

## The next chapter

AI will not eliminate the need for thoughtful engineering, original ideas, or responsible leadership. It will raise the baseline of what teams can produce. That makes human judgment more valuable, not less.

The tech industry's advantage in the next era will come from combining automation with accountability. The strongest products will be fast, accessible, and economically valuable—but they will also be understandable, secure, and genuinely useful to the people who depend on them.`,
};

const existing = unwrap(await getSupabase().from("posts").select("id").eq("slug", aiPost.slug).maybeSingle());
if (existing) {
  unwrap(await getSupabase().from("posts").update(aiPost).eq("id", existing.id));
  console.log("Updated the featured AI industry article.");
} else {
  unwrap(await getSupabase().from("posts").insert({ id: randomUUID(), ...aiPost }).select("id").single());
  console.log("Created the featured AI industry article.");
}
