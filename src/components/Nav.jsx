import React from 'react';
import { Logo } from '../../public/logo.png';
import '../css/nav.css';

function Nav() {
    return (
        <header className="nav-header">
            <div className="nav-logo">
                <img src="..\..\public\logo.png" alt="Logo" className="logo-image" />
            </div>
        </header>
    );
}

export default Nav;