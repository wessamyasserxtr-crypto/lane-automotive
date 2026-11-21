# LANE Automotive — 3D experience

## Scene map

| Area | Scene | Behavior and fallback |
| --- | --- | --- |
| Intro | Real Jetour T1 catalog photo moving through a dark studio with light trails | Short motion reveal; respects reduced-motion preference |
| Home hero | Auto-advancing real catalog photos on an illuminated showroom stage | Previous/next arrows and model dots select any catalog car; reduced-motion stops automatic changes |
| Vehicle details | Real exterior and interior photographs for every catalog vehicle, plus a 3D tab | Jetour T1, Chery Tiggo 8 Pro, and BYD Seal have interactive models; other cars show a clear unavailable message until a matching model is licensed |
| Inventory and other sections | Original vehicle-specific photos and semantic content | No substitute or category-shaped 3D mesh is presented as a real model |

The embedded models are community-created Sketchfab assets and retain their viewer controls and branding. Each viewer displays the model title, creator, source link, and CC BY 4.0 attribution. The BYD Seal model is the Performance AWD variant. Sketchfab streams the models, so interactive 3D requires an internet connection.

## Motion and access

- The home hero contains car photos only and changes between catalog vehicles automatically or when the visitor selects a control.
- A 3D viewer is mounted only after a visitor selects the 3D tab in a vehicle detail view.
- Intro movement follows `prefers-reduced-motion`. CSS stage motion is disabled for reduced-motion users.
- A matching T1 photograph remains visible behind the viewer during loading or if the remote embed is blocked.

## Validation

The implementation uses the existing React/Vite stack and Sketchfab iframes; no procedural vehicle geometry remains. Public models for the remaining catalog cars are not currently wired because the candidates found were view-only or carried non-commercial restrictions. A production build and device/browser review still need to be run in an environment with the project's dependencies installed.
