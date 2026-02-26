## Packages
framer-motion | Page transitions and scroll-triggered animations
react-confetti | Post-purchase celebration effect
lucide-react | Icons for the UI

## Notes
- Ensure tailwind.config.ts extends fontFamily with `display: ["var(--font-display)"]` and `sans: ["var(--font-sans)"]`.
- The API might return numeric values (prices) as strings from Postgres, so the frontend coerces them to Numbers for calculation and back to strings (toFixed(2)) for submission.
- Stock images use Unsplash fireworks/crackers photography.
