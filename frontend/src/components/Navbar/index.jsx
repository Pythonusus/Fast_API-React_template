import React from 'react'
import { NavLink, useLocation } from 'react-router-dom'
import { Icon } from 'semantic-ui-react'

import NavbarButton from '../NavbarButton'
import './Navbar.css'

const Navbar = () => {
  const location = useLocation()

  return (
    <nav className='custom-navbar'>
      <NavLink exact to='/'>
        <NavbarButton
          icon={<Icon name='search' size='large' inverted />}
          text='Найти кран'
          active={location.pathname === '/'}
        />
      </NavLink>
      <NavLink to='/compare'>
        <NavbarButton
          icon={<Icon name='table' size='large' inverted />}
          text='Таблица сравнения'
          active={location.pathname === '/compare'}
        />
      </NavLink>
      <NavLink to='/history'>
        <NavbarButton
          icon={<Icon name='history' size='large' inverted />}
          text='История расчетов'
          active={location.pathname === '/history'}
        />
      </NavLink>
      {/* <NavLink to='/about'>
        <NavbarButton
          icon={<Icon name='info circle' size='large' inverted />}
          text='О программе'
          active={location.pathname === '/about'}
        />
      </NavLink> */}
    </nav>
  )
}

export default Navbar
