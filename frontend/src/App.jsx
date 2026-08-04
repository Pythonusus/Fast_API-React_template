import React from "react";
import { Route, BrowserRouter as Router, Routes } from "react-router-dom";

import "@/src/App.css";

import About from "@/src/pages/About";
import Home from "@/src/pages/Home";
import NotFound404 from "@/src/pages/NotFound404";

function App() {
  return (
    /* Router container to handle the routing */
    <Router>
      <div className="app-container">
        <Header as="header" fixed="top" className="header">
          <div className="header-content"></div>
        </Header>

        {/* SPA routes */}
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/about" element={<About />} />
          <Route path="*" element={<NotFound404 />} />
        </Routes>
      </div>
    </Router>
  );
}

export default App;
