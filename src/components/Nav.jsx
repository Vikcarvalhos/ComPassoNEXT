import React from 'react';
import Logo from '../logo.png';
import '../css/nav.css';

function Nav() {
    return (
        <header className="nav-header">
            <div className="nav-logo">
                <img src={Logo} alt="Logo" className="logo-image" />
            </div>
        </header>
    );
}

export default Nav;