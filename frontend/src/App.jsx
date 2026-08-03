import React from 'react'
import { Route, BrowserRouter as Router, Routes } from 'react-router-dom'
import { Header } from 'semantic-ui-react'

import '@/src/App.css'
import 'semantic-ui-css/semantic.min.css'

import AppLogo from '@/src/components/AppLogo'
import Copyright from '@/src/components/Copyright'
import Navbar from '@/src/components/Navbar'
import About from '@/src/pages/About'
import CalcHistory from '@/src/pages/CalcHistory'
import ComparisonTable from '@/src/pages/ComparisonTable'
import CraneDetail from '@/src/pages/CraneDetail'
import Home from '@/src/pages/Home'
import NotFound from '@/src/pages/NotFound'

function App() {
  return (
    /* Router container to handle the routing */
    <Router>
      <div className='app-container'>
        {/* Full width header */}
        <Header as='header' fixed='top' className='custom-header'>
          <div className='header-content'>
            <AppLogo />

            <Navbar />

            <Copyright />
          </div>
        </Header>

        <Routes>
          <Route path='/' element={<Home />} />
          <Route path='/cranes/:name' element={<CraneDetail />} />
          <Route path='/compare' element={<ComparisonTable />} />
          <Route path='/history' element={<CalcHistory />} />
          <Route path='/about' element={<About />} />
          <Route path='*' element={<NotFound />} />
        </Routes>
      </div>
    </Router>
  )
}

export default App
