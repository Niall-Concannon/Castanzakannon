# Castanzakannon

Browser-based top-down roguelike with fast arena combat, unlockable loadouts, boss Totem encounters, and Supabase-backed progress. Runs in the browser using HTML5 Canvas and vanilla JavaScript, with cloud save and unlock persistence.

## Features

- Wave-based arena combat with evolving enemy waves and hazards
- Procedural maps and level themes for replay variety
- Multiple characters with distinct stats, dash behavior, and upgrades
- Weapon loadouts including special unlockable gear
- Void and Necromancer boss Totems with progression rewards
- Pickups, chests, upgrades, and achievement tracking
- Supabase authentication, autosave, and cloud save persistence

## Run Locally

1. Clone the repository.
2. Open `index.html` in a modern browser.

> No build tool required.

### Sample Cloud Account

Use the following credentials to test Supabase login and cloud save features:

- **Username:** `balcer`
- **Password:** `BALCER`

## Controls

- **Move:** Arrow keys or `WASD`
- **Dash:** `Space`
- **Shoot:** Left mouse button

## Project Structure

| File | Description |
|---|---|
| `index.html` | Entry point and Supabase script loader |
| `css/style.css` | Styles, layout, and UI visuals |
| `js/main.js` | Game bootstrap and section loader |
| `js/sections/00_cloud_auth.js` | Cloud auth, save, and unlock logic |
| `js/sections/04_map.js` | Procedural arena generation |
| `js/sections/05_player.js` | Player stats, loadout, and run flow |
| `js/sections/09_enemies.js` | Enemy and boss behavior |
| `js/sections/15_menu_screens.js` | Menus, encyclopedia, and UI screens |

## Technologies Used

- **HTML5 Canvas** — browser-native rendering for the game world
- **CSS3** — layout, styling, and responsive UI polish
- **JavaScript** — game logic, input, and interaction
- **Supabase JavaScript SDK** — authentication, cloud save, and persistence
- **Git** — version control and history
- **GitHub** — repository hosting and team collaboration
- **Visual Studio Code** — editor for development and debugging

## Team Members

- **Niall Concannon** – [GitHub](https://github.com/Niall-Concannon)
- **Daniel Balcerzak** – [GitHub](https://github.com/BALCER1)
- **Giuseppe Castagna** – [GitHub](https://github.com/GiuseppeCiroCastagna)
