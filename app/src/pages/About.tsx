import { SectionDivider } from "@/components/SectionDivider"
import { Button } from "@/components/ui/button"

const skills = [
  "Concept Art",
  "Environment",
  "Character Design",
  "Visual Development",
  "2D / 3D",
  "Photoshop",
  "Maya",
  "Visual Storytelling",
]

export function About() {
  return (
    <section className="container px-4 py-16 sm:px-6">
      <h1 className="mb-4 text-3xl font-semibold tracking-tight">关于</h1>
      <SectionDivider />
      <p className="mb-10 max-w-2xl text-muted-foreground leading-relaxed text-lg">
        视觉开发与概念艺术创作者，专注于角色设计、场景概念与视觉叙事。<br />
        Visual development and concept artist — character design, environment concept art, and visual storytelling.
      </p>
      <div className="mb-10 flex flex-wrap gap-3">
        {skills.map((s) => (
          <span
            key={s}
            className="rounded-lg border border-border bg-card px-4 py-2 text-sm font-medium text-muted-foreground transition-colors hover:border-primary hover:text-foreground"
          >
            {s}
          </span>
        ))}
      </div>
      <div className="flex flex-wrap gap-3">
        <Button asChild>
          <a href="/resume/简历 中文.pdf" download>简历 (中文)</a>
        </Button>
        <Button variant="outline" asChild>
          <a href="/resume/简历 _1_ (1).pdf" download>Resume (EN)</a>
        </Button>
      </div>
    </section>
  )
}
