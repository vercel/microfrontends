---
'@vercel/microfrontends': patch
---

Show a styled page in the browser when the local proxy can't reach an application, instead of a plain text error. Local applications get a note that they may still be starting up; `http://` fallbacks show the address they were reached at. Non-browser requests still get the plain text error.
