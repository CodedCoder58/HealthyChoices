import React from 'react';

interface HeaderProps {
    text: string;
}

const Header: React.FC<HeaderProps> = ({ text }) => {
    return (
        <header className="w-full p-4 border-b border-white/20 text-center">
            <h1 className="text-lg font-semibold tracking-widest text-gray-300 uppercase">{text}</h1>
        </header>
    );
};

export default Header;
