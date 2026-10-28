import { Routes, Route } from 'react-router-dom'
import { HiringProvider } from './lib/store.tsx'
import { Shell } from './components/Shell.tsx'
import Ad from './pages/Ad.tsx'
import Xray from './pages/Xray.tsx'
import Kit from './pages/Kit.tsx'
import LinkPage from './pages/Link.tsx'
import Live from './pages/Live.tsx'
import Score from './pages/Score.tsx'
import Receipt from './pages/Receipt.tsx'

export default function EmployerApp() {
  return (
    <HiringProvider>
      <Routes>
        <Route element={<Shell />}>
          <Route index element={<Ad />} />
          <Route path="xray" element={<Xray />} />
          <Route path="kit" element={<Kit />} />
          <Route path="link" element={<LinkPage />} />
          <Route path="live" element={<Live />} />
          <Route path="score/:id" element={<Score />} />
          <Route path="receipt/:id" element={<Receipt />} />
        </Route>
      </Routes>
    </HiringProvider>
  )
}
