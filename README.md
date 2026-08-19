# Astra Kids Academy — Learning Pathway Assessment

A lightweight, static web app that helps parents and students (ages 10–17)
identify a child's existing strengths and aspirations, and matches them to
the Astra Kids Academy learning studio best suited to nurture that growth.

## The five studios

- **AI & Digital Literacy Studio** — coding, robotics, AI tools, digital problem-solving
- **Entrepreneurship Studio** — idea generation, pitching, leadership, business basics
- **Creative Studio** — visual/written/performing arts, design thinking, storytelling
- **Project Management Studio** — planning, coordination, time management, follow-through
- **Innovation Studio** — invention, experimentation, hands-on STEM problem-solving

## How it works

1. **Intro** — captures the child's name (optional) and age (10–17, required),
   and whether a student or a parent/guardian is completing the assessment.
2. **Assessment** — 12 short, scenario-based questions. Each answer option maps
   to one of the five studios; there are no "right" answers.
3. **Results** — shows the top-matching studio with a description of what it
   develops, a secondary studio if the child shows strong blended interests,
   and a full percentage breakdown across all five studios. Results can be
   emailed to the enrollment team or printed/saved as a PDF.

No accounts, backend, or data collection are involved — everything runs
client-side in the browser and nothing is transmitted or stored beyond the
current session.

## Running locally

This is a static site with no build step. Open `index.html` directly in a
browser, or serve the folder locally, e.g.:

```bash
python3 -m http.server 8000
```

Then visit `http://localhost:8000`.

## Project structure

```
index.html          Markup for the three screens (intro, quiz, results)
assets/style.css     Styling and theming
assets/app.js        Question bank, studio data, and app logic
```

To adjust the question bank or studio descriptions, edit the `QUESTIONS` and
`STUDIOS` objects at the top of `assets/app.js`.
