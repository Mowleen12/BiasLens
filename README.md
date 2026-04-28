# BiasLens 🔍

**Fairness and bias detection for tabular datasets — right in your browser.**

BiasLens is a lightweight, privacy-first web app that helps data scientists, ML engineers, and students audit datasets for demographic bias before training models on them. Upload a CSV, pick a sensitive attribute (gender, race, age group…) and an outcome column (hired, approved, admitted…), and get an instant, explainable fairness report.

No account. No upload to a server. Your data never leaves your browser.

---

## ✨ Features

- **One-click CSV upload** with drag-and-drop, streaming parser, and live progress.
- **Automatic column inference** — BiasLens suggests likely sensitive/target column pairs.
- **Fairness metrics that matter**:
  - Selection rate per group with **95% Wilson confidence intervals**
  - **Disparate Impact Ratio** (the four-fifths rule)
  - **Statistical Parity Difference**
  - **Two-proportion z-test** with p-values to flag statistically significant gaps
- **Intersectional analysis** — combine two sensitive attributes (e.g. gender × age group).
- **Data quality panel** — flags missing values, tiny groups (<30 rows), and non-binary targets.
- **Plain-English narrative** explaining what the numbers actually mean.
- **Interactive charts** (Recharts) with per-group color coding and error bars.
- **Export anywhere** — download CSV results, copy a shareable summary, or save the full report as PDF.
- **Sample dataset** included so you can try it in one click.

## 🧠 Why BiasLens?

Most ML fairness tooling is heavyweight, Python-only, or assumes you already have a trained model. BiasLens focuses on the *first* step of the pipeline: **understanding whether your dataset itself is fair**, in seconds, with zero setup.

Built as an MVP by an AI/ML student team, designed to be extended into full model auditing and bias mitigation.

## 🚀 Getting Started

```bash
# Install dependencies
bun install

# Run the dev server
bun run dev

# Build for production
bun run build
```

Then open `http://localhost:5173` and either upload your own CSV or click **Try sample dataset**.

## 🛠️ Tech Stack

- **Framework**: [TanStack Start](https://tanstack.com/start) (React 19 + Vite 7, file-based routing, SSR-ready)
- **Styling**: Tailwind CSS v4 with a semantic design-token system
- **UI**: shadcn/ui + Radix primitives + lucide-react icons
- **CSV parsing**: Papa Parse (streaming)
- **Charts**: Recharts with Wilson confidence intervals
- **Notifications**: sonner

## 📊 How It Works

1. **Upload** a CSV file (parsed entirely in-browser).
2. **Select** a sensitive attribute (e.g. `gender`) and a binary target column (e.g. `hired`).
3. **Set a fairness threshold** — the maximum acceptable gap in selection rates between groups.
4. **Analyze** — BiasLens computes per-group selection rates, runs the four-fifths rule, statistical parity difference, and a two-proportion z-test.
5. **Read the report** — verdict banner, metrics cards, group breakdown chart with error bars, and a plain-English narrative you can copy or export.

## 🗺️ Roadmap

- [ ] Model-level fairness auditing (predictions vs. labels, equalized odds, equal opportunity)
- [ ] Bias mitigation suggestions (reweighing, resampling, threshold tuning)
- [ ] Multi-class targets
- [ ] Server-side analysis for very large datasets
- [ ] Saveable report links

## 📄 License

MIT — feel free to fork, extend, and use in your own projects.

---

Made with ❤️ for fair ML.