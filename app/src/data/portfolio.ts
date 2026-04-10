export interface WorkItem {
  slug: string
  src: string
  title: string
  category: string
  tags: string[]
  date?: string
  type: "personal" | "school"
  description?: string
  role?: string
  tools?: string[]
  process?: string[]
  mood?: string[]
  notes?: string
}

export interface ShowcaseWorkItem {
  slug: string
  src: string
  title: string
  subtitle: string
  category: string
  tags: string[]
  date: string
  glow?: string
}

export interface SocialLink {
  label: string
  href: string
}

export interface SkillGroup {
  label: string
  items: string[]
}

export interface EducationItem {
  period: string
  title: string
  org: string
  description?: string
  note?: string
}

export interface AboutGalleryItem {
  src: string
  title: string
  category: string
}

export interface AboutSectionImage {
  src: string
  alt: string
}

export interface AboutSectionText {
  title: string
  text: string
}

export interface AboutApproachItem {
  label: string
  description: string
}

export interface AboutToolLevel {
  name: string
  level: number
}

export const ALL_WORKS: WorkItem[] = [
  {
    slug: "world-tree",
    src: "/image/personal/world tree.png",
    title: "World Tree",
    category: "Environment Design",
    tags: ["concept art", "environment", "fantasy"],
    date: "2025",
    type: "personal",
    description: "Fantasy environment concept — a colossal ancient tree as the axis of civilization.",
    role: "Concept Artist",
    tools: ["Photoshop", "Blender"],
    process: ["Reference gathering", "Thumbnail sketches", "Color exploration", "Final render"],
    mood: ["Epic", "Atmospheric", "Ancient"],
    notes: "Explored how scale and vertical composition convey the idea of a world-axis. Layered fog planes create depth separation between civilization levels.",
  },
  {
    slug: "sakura-village",
    src: "/image/personal/sakura-villege.png",
    title: "Sakura Village",
    category: "Environment Design",
    tags: ["concept art", "japanese"],
    date: "2025",
    type: "personal",
    description: "Japanese-inspired village surrounded by cherry blossoms and misty mountains.",
    role: "Environment Designer",
    tools: ["Photoshop"],
    process: ["Photo studies", "Composition sketches", "Color keys", "Detail pass"],
    mood: ["Serene", "Nostalgic", "Warm"],
    notes: "Japanese architectural forms with cherry blossom canopy. Color palette restricted to pinks and muted greens to maintain cohesion.",
  },
  {
    slug: "enchanted-forest",
    src: "/image/personal/%E6%A3%AE%E6%9E%97.png",
    title: "Enchanted Forest",
    category: "Environment Design",
    tags: ["concept art", "forest"],
    date: "2024",
    type: "personal",
    description: "Deep forest environment with ethereal lighting and mystical atmosphere.",
    role: "Concept Artist",
    tools: ["Photoshop"],
    process: ["Photo bashing", "Light studies", "Atmosphere pass", "Final composite"],
    mood: ["Mystical", "Atmospheric", "Quiet"],
    notes: "Focused on volumetric lighting filtering through the canopy. Mist layers create depth and draw the eye toward the light source.",
  },
  {
    slug: "sword-immortal",
    src: "/image/personal/%E5%89%91%E4%BB%99.png",
    title: "Sword Immortal",
    category: "Character Design",
    tags: ["character", "fantasy"],
    date: "2024",
    type: "personal",
    description: "Wuxia character design — a swordsman ascending through celestial realms.",
    role: "Character Designer",
    tools: ["Photoshop", "Procreate"],
    process: ["Silhouette exploration", "Costume research", "Value pass", "Final render"],
    mood: ["Cinematic", "Mythic", "Dynamic"],
    notes: "Wuxia character exploring the intersection of martial arts and celestial imagery. Flowing garments suggest motion even in a static pose.",
  },
  {
    slug: "personal-project",
    src: "/image/personal/personal project.jpg",
    title: "Personal Project",
    category: "Visual Development",
    tags: ["vis dev", "narrative"],
    date: "2024",
    type: "personal",
    description: "Narrative visual development exploring cinematic storytelling through image-making.",
  },
  {
    slug: "temple-sketch",
    src: "/image/personal/%E5%AF%BA%E5%BA%99%E8%8D%89%E7%A8%BF.jpg",
    title: "Temple Sketch",
    category: "Visual Development",
    tags: ["architecture", "sketch"],
    date: "2024",
    type: "personal",
    description: "Architectural concept — traditional temple in misty mountains.",
  },
  {
    slug: "artist-portrait",
    src: "/image/personal/artist (1).png",
    title: "Artist Portrait",
    category: "Character Design",
    tags: ["character", "portrait"],
    date: "2025",
    type: "personal",
    description: "Character portrait study exploring personality and expression.",
  },
  {
    slug: "environment-study-i",
    src: "/image/school/enviroment 1.png",
    title: "Environment Study I",
    category: "Environment Design",
    tags: ["environment", "study"],
    date: "2024",
    type: "school",
    description: "Academic environment painting exploring composition and color temperature.",
  },
  {
    slug: "environment-study-ii",
    src: "/image/school/enviroment 2.png",
    title: "Environment Study II",
    category: "Environment Design",
    tags: ["environment", "study"],
    date: "2024",
    type: "school",
    description: "Environment study focused on atmospheric perspective and depth.",
  },
  {
    slug: "environment-study-iii",
    src: "/image/school/enviroment 3.png",
    title: "Environment Study III",
    category: "Environment Design",
    tags: ["environment", "study"],
    date: "2024",
    type: "school",
    description: "Environment study exploring natural lighting and terrain forms.",
  },
  {
    slug: "environment-study-iv",
    src: "/image/school/enviroment 4.png",
    title: "Environment Study IV",
    category: "Environment Design",
    tags: ["environment", "study"],
    date: "2024",
    type: "school",
    description: "Environment study with emphasis on mood and spatial design.",
  },
  {
    slug: "character-vis-dev",
    src: "/image/school/vis_dev_character.png",
    title: "Character Vis Dev",
    category: "Character Design",
    tags: ["vis dev", "character"],
    date: "2024",
    type: "school",
    description: "Character visual development for narrative production.",
  },
  {
    slug: "prop-design",
    src: "/image/school/vis_dev_prop.png",
    title: "Prop Design",
    category: "Visual Development",
    tags: ["vis dev", "prop"],
    date: "2024",
    type: "school",
    description: "Prop design exploring form language and material storytelling.",
  },
  {
    slug: "vehicle-design",
    src: "/image/school/vis_dev_vehicle.png",
    title: "Vehicle Design",
    category: "Visual Development",
    tags: ["vis dev", "vehicle"],
    date: "2024",
    type: "school",
    description: "Vehicle concept design blending function and narrative context.",
  },
  {
    slug: "visual-development-i",
    src: "/image/school/vis dev.jpg",
    title: "Visual Development I",
    category: "Visual Development",
    tags: ["vis dev", "narrative"],
    date: "2024",
    type: "school",
    description: "Visual development piece exploring narrative through image-making.",
  },
  {
    slug: "visual-development-ii",
    src: "/image/school/vis dev (2).jpg",
    title: "Visual Development II",
    category: "Visual Development",
    tags: ["vis dev", "narrative"],
    date: "2024",
    type: "school",
    description: "Continuation of visual development narrative studies.",
  },
  {
    slug: "visual-development-iii",
    src: "/image/school/vis dev 3.jpg",
    title: "Visual Development III",
    category: "Visual Development",
    tags: ["vis dev", "narrative"],
    date: "2024",
    type: "school",
    description: "Visual development exploring cinematic framing and storytelling.",
  },
  {
    slug: "creative-perspective",
    src: "/image/school/creative prespetive.jpg",
    title: "Creative Perspective",
    category: "Fundamentals",
    tags: ["perspective", "study"],
    date: "2024",
    type: "school",
    description: "Perspective fundamentals applied to creative scene composition.",
  },
  {
    slug: "creative-perspective-ii",
    src: "/image/school/creative prespetive (2).png",
    title: "Creative Perspective II",
    category: "Fundamentals",
    tags: ["perspective", "study"],
    date: "2024",
    type: "school",
    description: "Advanced perspective study with architectural subjects.",
  },
  {
    slug: "background-painting",
    src: "/image/school/24FA_MonBGptg_Wk12_v02_Jay.png",
    title: "Background Painting",
    category: "Environment Design",
    tags: ["painting", "background"],
    date: "2024",
    type: "school",
    description: "Background painting study for animation production pipeline.",
  },
  {
    slug: "mars-monster",
    src: "/image/school/mars monster.png",
    title: "Mars Monster",
    category: "Character Design",
    tags: ["creature", "character"],
    date: "2024",
    type: "school",
    description: "Creature design exploring alien biology and hostile environments.",
  },
  {
    slug: "3d-modeling-maya",
    src: "/image/school/maya.png",
    title: "3D Modeling — Maya",
    category: "3D",
    tags: ["maya", "3d"],
    date: "2024",
    type: "school",
    description: "3D modeling study using Autodesk Maya.",
  },
  {
    slug: "3d-modeling-maya-ii",
    src: "/image/school/maya (2).png",
    title: "3D Modeling — Maya II",
    category: "3D",
    tags: ["maya", "3d"],
    date: "2024",
    type: "school",
    description: "Continued 3D modeling exploration in Maya.",
  },
  {
    slug: "cat-diary",
    src: "/image/school/cat diary (1).png",
    title: "Cat Diary",
    category: "Illustration",
    tags: ["illustration", "narrative"],
    date: "2024",
    type: "school",
    description: "Narrative illustration series exploring daily moments through a feline lens.",
  },
  {
    slug: "sketching-for-entd",
    src: "/image/school/sketching for entd.png",
    title: "Sketching for ENTD",
    category: "Fundamentals",
    tags: ["sketch", "study"],
    date: "2024",
    type: "school",
    description: "Foundational sketching studies for entertainment design.",
  },
]

export const HOME_SHOWCASE_WORKS: ShowcaseWorkItem[] = [
  {
    slug: "world-tree",
    src: "/image/personal/world%20tree.png",
    title: "WORLD TREE",
    subtitle:
      "Fantasy environment concept — a colossal ancient tree as the axis of civilization",
    category: "Environment Design",
    tags: ["concept art", "environment", "fantasy"],
    date: "2025.01",
    glow: "rgba(41, 122, 78, 0.26)",
  },
  {
    slug: "sakura-village",
    src: "/image/personal/sakura-villege.png",
    title: "SAKURA VILLAGE",
    subtitle:
      "Japanese-inspired village surrounded by cherry blossoms and misty mountains",
    category: "Environment Design",
    tags: ["concept art", "japanese"],
    date: "2025.02",
    glow: "rgba(183, 112, 79, 0.24)",
  },
  {
    slug: "enchanted-forest",
    src: "/image/personal/%E6%A3%AE%E6%9E%97.png",
    title: "ENCHANTED FOREST",
    subtitle: "Deep forest environment with ethereal lighting and mystical atmosphere",
    category: "Environment Design",
    tags: ["concept art", "forest"],
    date: "2024.11",
    glow: "rgba(142, 160, 58, 0.22)",
  },
  {
    slug: "sword-immortal",
    src: "/image/personal/%E5%89%91%E4%BB%99.png",
    title: "SWORD IMMORTAL",
    subtitle: "Wuxia character design — a swordsman ascending through celestial realms",
    category: "Character Design",
    tags: ["character", "fantasy"],
    date: "2024.09",
    glow: "rgba(96, 83, 177, 0.22)",
  },
  {
    slug: "temple-sketch",
    src: "/image/personal/%E5%AF%BA%E5%BA%99%E8%8D%89%E7%A8%BF.jpg",
    title: "TEMPLE SKETCH",
    subtitle: "Architectural concept — traditional temple in misty mountains",
    category: "Visual Development",
    tags: ["architecture", "sketch", "concept art"],
    date: "2024.08",
    glow: "rgba(170, 126, 82, 0.22)",
  },
  {
    slug: "environment-study-i",
    src: "/image/school/enviroment%201.png",
    title: "ENVIRONMENT STUDY",
    subtitle:
      "Academic environment painting exploring composition and color temperature",
    category: "Visual Development",
    tags: ["environment", "school"],
    date: "2024.10",
    glow: "rgba(100, 130, 160, 0.22)",
  },
]

export const CONTACT_SOCIAL_LINKS: SocialLink[] = [
  { label: "ArtStation", href: "https://artstation.com/shijielin" },
  { label: "LinkedIn", href: "https://linkedin.com/in/shijielin" },
  { label: "Instagram", href: "https://instagram.com/shijielin" },
]

export const RESUME_EDUCATION: EducationItem[] = [
  {
    period: "2023 — Present",
    title: "Visual Development & Concept Art",
    org: "Art Center / University",
    note: "Focus on environment design, character design, and visual storytelling.",
  },
]

export const RESUME_SKILLS: SkillGroup[] = [
  {
    label: "Disciplines",
    items: [
      "Concept Art",
      "Visual Development",
      "Environment Design",
      "Character Design",
      "Worldbuilding",
      "Digital Illustration",
    ],
  },
  {
    label: "Tools",
    items: ["Photoshop", "Procreate", "Maya", "Blender", "After Effects"],
  },
]

export const ABOUT_SECTION_STATEMENT =
  "I craft worlds that exist between imagination and reality."

export const ABOUT_SECTION_IMAGES: AboutSectionImage[] = [
  { src: "/image/personal/sakura-villege.png", alt: "Sakura Village" },
  { src: "/image/personal/artist%20(1).png", alt: "Self Portrait" },
  { src: "/image/personal/world%20tree.png", alt: "World Tree" },
  { src: "/image/personal/%E5%AF%BA%E5%BA%99%E8%8D%89%E7%A8%BF.jpg", alt: "Temple Sketch" },
]

export const ABOUT_HERO_IMAGE = "/image/personal/world tree.png"

export const ABOUT_ARTIST_STATEMENT =
  "I craft worlds that exist in the space between imagination and reality — designing the environments, characters, and atmospheres that bring fantasy narratives to life."

export const ABOUT_BIO_SECTIONS: AboutSectionText[] = [
  {
    title: "Background",
    text: "I'm Shijie Lin, a concept artist and visual development artist specializing in fantasy worldbuilding. My journey began with a deep fascination for the surreal and the mythological — stories that transport you to places that feel both impossible and inevitable.",
  },
  {
    title: "Practice",
    text: "My work spans environment design, character design, and cinematic illustration. I approach each piece as a fragment of a larger narrative — every rock formation, every shaft of light, every silhouette tells a story. I draw heavily from Eastern and Western mythology, architectural history, and the natural world.",
  },
  {
    title: "Vision",
    text: "Currently focused on building immersive visual worlds through digital painting, 3D exploration, and cross-media visual development. I believe the best concept art doesn't just show you a place — it makes you feel like you've been there before, in a dream you can't quite remember.",
  },
]

export const ABOUT_APPROACH: AboutApproachItem[] = [
  {
    label: "Narrative First",
    description:
      "Every environment tells a story. I start with the emotion and narrative purpose before touching a single brush stroke.",
  },
  {
    label: "World Logic",
    description:
      "Believable worlds need internal consistency — from geological formations to architectural traditions to how light interacts with atmosphere.",
  },
  {
    label: "Mood & Atmosphere",
    description:
      "Color, light, and composition are my primary tools for establishing the emotional tone that draws viewers into the world.",
  },
  {
    label: "Cross-Media Thinking",
    description:
      "I work across 2D painting, 3D blockout, and photo-bashing to find the approach that best serves each piece's intent.",
  },
]

export const ABOUT_DISCIPLINES = [
  "Concept Art",
  "Visual Development",
  "Environment Design",
  "Character Design",
  "Worldbuilding",
  "Digital Illustration",
  "Matte Painting",
  "Storyboarding",
]

export const ABOUT_TOOLS: AboutToolLevel[] = [
  { name: "Photoshop", level: 95 },
  { name: "Procreate", level: 90 },
  { name: "Maya", level: 75 },
  { name: "Blender", level: 70 },
  { name: "After Effects", level: 65 },
  { name: "ZBrush", level: 55 },
]

export const ABOUT_EDUCATION: EducationItem[] = [
  {
    period: "2023 — Present",
    title: "Visual Development & Concept Art",
    org: "University Program",
    description:
      "Focused study in environment design, character design, visual storytelling, and production pipeline for animation and games.",
  },
]

export const ABOUT_GALLERY_IMAGES: AboutGalleryItem[] = [
  { src: "/image/personal/sakura-villege.png", title: "Sakura Village", category: "Environment" },
  { src: "/image/personal/%E6%A3%AE%E6%9E%97.png", title: "Enchanted Forest", category: "Environment" },
  { src: "/image/personal/%E5%89%91%E4%BB%99.png", title: "Sword Immortal", category: "Character" },
  { src: "/image/school/enviroment 1.png", title: "Environment Study I", category: "School" },
  { src: "/image/school/vis_dev_character.png", title: "Vis Dev Character", category: "School" },
  { src: "/image/school/24FA_MonBGptg_Wk12_v02_Jay.png", title: "Background Painting", category: "School" },
]
