# LANE Automotive project update

- Replaced the unconnected appointment form and fake confirmation endpoint with direct WhatsApp viewing requests, prefilled with the selected car when applicable.
- Updated the navigation, car detail, finance, and showroom contact actions to WhatsApp.
- Switched the server assistant to Gemini Interactions in the TypeScript SDK. Model answers now use the same catalog source as the site, follow the selected language and currency, and distinguish indicative catalog prices from live availability.
- Added conditional Google Search for public automotive/competitor research and URL Context for customer-provided links. Returned source citations appear as clickable links.
- Added motion to inventory cards, the assistant panel and messages, the hero image, and the introductory car wheels. Motion respects the device's reduced-motion setting.
- Added photo transitions through the catalog cars during the intro sequence.
- Removed the category-based procedural car mesh after review found it looked cartoonish and did not match the catalog vehicles.
- Replaced the hero stage with an auto-advancing photo showcase for every catalog car, with manual arrows and selection dots. The homepage no longer shows a 3D model.
- Added a 3D tab to each car detail view. Licensed, matching interactive models are available for the Jetour T1, Chery Tiggo 8 Pro, and BYD Seal, with author, source, and CC BY attribution shown in the viewer. Other cars display a translated availability message rather than a substitute mesh.
- Updated the standalone HTML preview to use the same photo carousel and detail-view 3D options. The interactive models stream from Sketchfab and need an internet connection.
- Updated showroom and assistant copy in Arabic, English, French, Chinese, and German; refreshed the project name and run instructions.

## Setup

Install dependencies, configure `GEMINI_API_KEY` in `.env.local`, and run `npm run dev`. See `README.md` for details.
