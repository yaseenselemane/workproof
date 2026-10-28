import { StrictMode, Suspense, lazy } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { MotionConfig } from 'motion/react'
// Bundled, not fetched: the demo must look right on venue wifi or none at all.
import '@fontsource-variable/plus-jakarta-sans/index.css'
import '@fontsource/ibm-plex-mono/400.css'
import '@fontsource/ibm-plex-mono/500.css'
import './styles.css'

// Split by route: a candidate's phone loads only the test, never the landing page's scroll libraries.
const Landing = lazy(() => import('./pages/Landing.tsx'))
const Candidate = lazy(() => import('./pages/Candidate.tsx'))
const EmployerApp = lazy(() => import('./EmployerApp.tsx'))

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <MotionConfig reducedMotion="user">
      <BrowserRouter>
        <Suspense fallback={<div className="min-h-screen bg-ground" aria-busy="true" />}>
          <Routes>
            <Route path="/" element={<Landing />} />
            <Route path="/t/:code" element={<Candidate />} />
            <Route path="/app/*" element={<EmployerApp />} />
          </Routes>
        </Suspense>
      </BrowserRouter>
    </MotionConfig>
  </StrictMode>,
)
