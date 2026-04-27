This site started as a rejection of the usual static portfolio grid: I wanted motion that felt authored, not decorative — scroll as choreography, not parallax wallpaper. That constraint pushed every technical decision downstream.

## Three.js as the stage, not the gimmick

The hero and supporting scenes use Three.js with careful draw-call budgeting and instancing where it mattered. The hardest part was not WebGL itself but keeping frame time stable while GSAP and React reconciliation were also fighting for the main thread. Profiling on mid-tier laptops became a weekly habit, not a launch-week panic.

ScrollTrigger is the spine of the experience: sections pin, hand off, and release in sequences that would be brittle with imperative listeners. The tradeoff is mental overhead — timelines are code you read like music. When a pin went wrong, the bug was almost always an overlapping trigger or a container whose height changed after layout.

## Cursor, physics, and the footer you did not expect

A custom cursor sounds trivial until you account for hit targets, text selection, reduced-motion preferences, and touch devices where a cursor metaphor does not exist. The implementation keeps a single source of truth for pointer state and degrades cleanly.

Matter.js in the footer is pure play — but it is also a stress test for resize and DPR changes. Bodies are recreated when the canvas dimensions change; forgetting that path leaks worlds and stutters. Wiring it behind a user-controlled toggle kept first paint honest for people who never scroll that far.

## Shipping on Cloudflare Workers

The production build is static assets behind a tiny Worker: www redirect, then pass-through to the asset binding. No Node server, no cold starts beyond the edge itself. The tradeoff is discipline about routing: every HTML entry the dev server understands must also exist in `dist` or navigation falls through to the wrong shell — something this write-up exists partly to document for my future self.

If you are building something similar: profile early on hardware you are embarrassed to admit you still own, treat motion as optional layers, and version your content routes the same way you version your API. The cinematic finish is worthless if the link to the essay opens the wrong app shell.

<!-- Drop files into ./images/ and embed, e.g. ![Label](./images/screenshot.png) -->
