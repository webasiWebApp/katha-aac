# Graph Report - katha-aac  (2026-10-31)

## Corpus Check
- Corpus is ~20,642 words - fits in a single context window. You may not need a graph.

## Summary
- 156 nodes · 119 edges · 51 communities (10 shown, 41 thin omitted)
- Extraction: 97% EXTRACTED · 3% INFERRED · 1% AMBIGUOUS · INFERRED: 3 edges (avg confidence: 0.88)
- Token cost: 0 input · 0 output

## Community Hubs (Navigation)
- package.json Overview
- Expo Agent Guidelines & Setup Docs
- app.json Expo Config
- Runtime Dependencies
- Dev Tooling Dependencies
- npm Scripts
- Android Adaptive Icon Config
- Template App Entry
- ESLint Boundaries Config
- TypeScript Config

## God Nodes (most connected - your core abstractions)
1. `expo` - 11 edges
2. `scripts` - 10 edges
3. `AGENTS.md Expo agent guidelines` - 7 edges
4. `adaptiveIcon` - 5 edges
5. `Katha AAC Phase 1 Step 0 setup log` - 5 edges
6. `android` - 4 edges
7. `compilerOptions` - 3 edges
8. `Development build (vs Expo Go)` - 3 edges
9. `Expo SDK 58 blank-typescript project` - 3 edges
10. `Boundary rule (eslint-plugin-boundaries)` - 3 edges

## Surprising Connections (you probably didn't know these)
- `Expo Router navigation` --conceptually_related_to--> `React Navigation layout`  [AMBIGUOUS]
  AGENTS.md → SETUP_LOG.md
- `Placeholders to change` --references--> `AGENTS.md Expo agent guidelines`  [EXTRACTED]
  SETUP_LOG.md → AGENTS.md
- `Expo SDK 58 blank-typescript project` --conceptually_related_to--> `Development build (vs Expo Go)`  [INFERRED]
  SETUP_LOG.md → AGENTS.md

## Import Cycles
- None detected.

## Hyperedges (group relationships)
- **Setup verification checks** — setup_log_verification, setup_log_configuration_files, setup_log_boundary_rule [INFERRED 0.75]

## Communities (51 total, 41 thin omitted)

### Community 0 - "package.json Overview"
Cohesion: 0.10
Nodes (20): main, name, private, version, expo-dev-client, expo-speech, expo-sqlite, jest (+12 more)

### Community 1 - "Expo Agent Guidelines & Setup Docs"
Cohesion: 0.13
Nodes (18): Continuous Native Generation (CNG), Development build (vs Expo Go), EAS build, submit and update, AGENTS.md Expo agent guidelines, Expo CLI commands (expo install, lint, tsc, doctor), Fetch versioned Expo docs (do not trust training data), Expo Router navigation, Boundary rule (eslint-plugin-boundaries) (+10 more)

### Community 2 - "app.json Expo Config"
Cohesion: 0.15
Nodes (12): expo, icon, ios, name, orientation, plugins, slug, userInterfaceStyle (+4 more)

### Community 3 - "Runtime Dependencies"
Cohesion: 0.17
Nodes (12): dependencies, expo, expo-dev-client, expo-speech, expo-sqlite, expo-status-bar, react, react-native (+4 more)

### Community 4 - "Dev Tooling Dependencies"
Cohesion: 0.17
Nodes (12): devDependencies, eslint, eslint-config-expo, eslint-plugin-boundaries, jest, jest-expo, prettier, react-test-renderer (+4 more)

### Community 5 - "npm Scripts"
Cohesion: 0.20
Nodes (10): scripts, android, format, format:check, ios, lint, start, test (+2 more)

### Community 6 - "Android Adaptive Icon Config"
Cohesion: 0.25
Nodes (8): backgroundColor, backgroundImage, foregroundImage, monochromeImage, adaptiveIcon, package, predictiveBackGestureEnabled, android

### Community 7 - "Template App Entry"
Cohesion: 0.33
Nodes (5): App(), styles, expo, expo-status-bar, react-native

### Community 8 - "ESLint Boundaries Config"
Cohesion: 0.29
Nodes (6): boundaries, { defineConfig }, expoFlat, eslint, eslint-config-expo, eslint-plugin-boundaries

### Community 9 - "TypeScript Config"
Cohesion: 0.29
Nodes (6): expo/tsconfig.base, compilerOptions, paths, strict, extends, include

## Ambiguous Edges - Review These
- `Expo Router navigation` → `React Navigation layout`  [AMBIGUOUS]
  SETUP_LOG.md · relation: conceptually_related_to

## Knowledge Gaps
- **24 isolated node(s):** `@react-navigation/native`, `@react-navigation/native-stack`, `expo-dev-client`, `expo-speech`, `expo-sqlite` (+19 more)
  These have ≤1 connection - possible missing edges or undocumented components. (Counts symbols only; 124 node(s) total have ≤1 connection when file, concept and rationale nodes are included.)
- **41 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `dependencies` connect `Runtime Dependencies` to `package.json Overview`?**
  _High betweenness centrality (0.057) - this node is a cross-community bridge._
- **What connects `@react-navigation/native`, `@react-navigation/native-stack`, `expo-dev-client` to the rest of the system?**
  _24 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `package.json Overview` be split into smaller, more focused modules?**
  _Cohesion score 0.09523809523809523 - nodes in this community are weakly interconnected._
- **Why does `devDependencies` connect `Dev Tooling Dependencies` to `package.json Overview`?**
  _High betweenness centrality (0.057) - this node is a cross-community bridge._
- **Should `Expo Agent Guidelines & Setup Docs` be split into smaller, more focused modules?**
  _Cohesion score 0.13071895424836602 - nodes in this community are weakly interconnected._
- **Why does `scripts` connect `npm Scripts` to `package.json Overview`?**
  _High betweenness centrality (0.048) - this node is a cross-community bridge._

### Low-confidence Hints
_AMBIGUOUS edges — the extractor was unsure. Verify before acting on these._

- **What is the exact relationship between `Expo Router navigation` and `React Navigation layout`?**
  _Edge tagged AMBIGUOUS (relation: conceptually_related_to) - confidence is low._