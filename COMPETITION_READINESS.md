# PhysioSmart AI — Competition Readiness

## Innovation
An educational DPT platform connecting curriculum study, BCQs, physiotherapy special tests and AI-assisted case reasoning. AI is a learning aid, not a validated clinical decision-support tool.

## Demo
1. Open the homepage on the public production domain.
2. Explore a semester in Curriculum and a topic in Study.
3. Open a special test and review precautions.
4. Enter a **fictional** clinical case and generate the short seven-section report.
5. Generate 3 topic-based BCQs and review feedback.
6. Install via the browser's Add to Home Screen / Install app option where supported.

## Important safety and operational notes
- Never enter identifiable patient information.
- Verify red-flag handling and urgent referral guidance with qualified physiotherapy faculty.
- The included AI rate limit is **per server process only** and not reliable across Vercel instances. Add shared durable rate limiting and usage quotas before public scaling.
- AI needs network connectivity and a valid GEMINI_API_KEY. The service worker does not cache AI results.
- Check Gemini model availability for your API key and test fallbacks.
- PWA SVG icons may not satisfy all platforms; add 192x192 and 512x512 PNG icons for broad installation compatibility.
- Test on Android Chrome, desktop Chrome and iOS Safari; installation experiences vary.
- Conduct keyboard, screen-reader, mobile, performance and cross-browser checks.
- Collect opt-in feedback and assess educational outcomes before making impact claims.
- Update privacy policy, consent and data retention before processing real patient data.

## Submission package
Prepare a 2-page project brief, 8-slide pitch, 2-minute screen recording, public production link, demo test cases and faculty evaluation plan.
