import React from 'react'
import './NavbarButton.css'

const NavbarButton = ({
  icon,
  text,
  onClick,
  className = '',
  active = false,
}) => {
  return (
    <button
      className={`navbar-button ${active ? 'active' : ''} ${className}`}
      onClick={onClick}
    >
      {icon && <span className='navbar-button-icon'>{icon}</span>}
      {text && <span className='navbar-button-text'>{text}</span>}
    </button>
  )
}

export default NavbarButton
