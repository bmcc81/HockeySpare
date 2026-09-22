# Player highlights demo

Local preview: `/tournaments/demo-highlights-cup` and the home screen.

The demo contains fictional players Alex Morgan (#19), Marcus Reed (#27), and Leo Chen (#8), two teams, four completed games, and twelve stat lines. Team and event names are marked Demo. No existing players or games are modified.

After applying migrations and building the API, run `node apps/api/scripts/seed-player-highlights.cjs` from the repository root. The script only accepts a localhost database. It upserts its own fixed demo IDs in a transaction; rerunning refreshes dates without duplicating records. Three games fall within the past seven days; the fourth is twelve days old.

Expected weekly totals: Alex 13 points, Leo 11, Marcus 9. Overall totals: Alex 15, Marcus 14, Leo 13.

## Portraits

Generated with the built-in imagegen tool, then encoded as JPEG for faster loading. No real-player likenesses were copied.

- `apps/web/public/images/players/alex-morgan.jpg`
- `apps/web/public/images/players/marcus-reed.jpg`
- `apps/web/public/images/players/leo-chen.jpg`

Reference direction: https://mtlhl.com/list/stars-of-the-week/ (player portraits, names, jersey numbers).

## Generation prompts

### alex

Use case: photorealistic-natural. Asset type: hockey player roster portrait for a sports website. Fictional adult male hockey player, 28 years old, light skin, short brown hair and light stubble, navy jersey with ice blue shoulders. Chest-up studio sports portrait, facing the camera, relaxed confident expression, no helmet, realistic adult recreational athlete. Dark navy softly blurred arena backdrop, consistent soft studio key light and cool rim light, centered head and shoulders with space above head, square composition. Clean professional team media day photography. No logos, no text, no numbers, no watermarks. Entirely fictional person.

### marcus

Use case: photorealistic-natural. Asset type: hockey player roster portrait for a sports website. Fictional adult male hockey player, 30 years old, Black, close-cropped hair and short beard, white jersey with navy shoulders. Chest-up studio sports portrait, facing the camera, relaxed confident expression, no helmet, realistic adult recreational athlete. Dark navy softly blurred arena backdrop, consistent soft studio key light and cool rim light, centered head and shoulders with space above head, square composition. Clean professional team media day photography. No logos, no text, no numbers, no watermarks. Entirely fictional person.

### leo

Use case: photorealistic-natural. Asset type: hockey player roster portrait for a sports website. Fictional adult male hockey player, 25 years old, East Asian, short black hair, navy jersey with ice blue shoulders. Chest-up studio sports portrait, facing the camera, relaxed confident expression, no helmet, realistic adult recreational athlete. Dark navy softly blurred arena backdrop, consistent soft studio key light and cool rim light, centered head and shoulders with space above head, square composition. Clean professional team media day photography. No logos, no text, no numbers, no watermarks. Entirely fictional person.
