import { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';

export default function Navbar() {
    const [scrolled, setScrolled] = useState(false);
    const { user, isAuthenticated, logout } = useAuth();
    const location = useLocation();

    useEffect(() => {
        const handleScroll = () => {
            setScrolled(window.scrollY > 20);
        };
        window.addEventListener('scroll', handleScroll);
        return () => window.removeEventListener('scroll', handleScroll);
    }, []);

    const isActive = (path: string) => location.pathname === path;

    return (
        <nav
            className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${scrolled
                    ? 'bg-white shadow-md'
                    : 'bg-white/95 backdrop-blur-sm'
                }`}
        >
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="flex justify-between items-center h-20">
                    <Link to="/" className="flex items-center">
                        <span className="text-2xl font-heading font-bold text-black">
                            Sam<span className="text-cf-red">Fit</span>
                        </span>
                    </Link>

                    <div className="hidden md:flex items-center space-x-8">
                        <Link
                            to="/"
                            className={`text-sm font-semibold uppercase tracking-wider transition-colors ${isActive('/')
                                    ? 'text-cf-red'
                                    : 'text-black hover:text-cf-red'
                                }`}
                        >
                            Home
                        </Link>
                        <Link
                            to="/workouts"
                            className={`text-sm font-semibold uppercase tracking-wider transition-colors ${isActive('/workouts')
                                    ? 'text-cf-red'
                                    : 'text-black hover:text-cf-red'
                                }`}
                        >
                            Workouts
                        </Link>
                        <Link
                            to="/upload"
                            className={`text-sm font-semibold uppercase tracking-wider transition-colors ${isActive('/upload')
                                    ? 'text-cf-red'
                                    : 'text-black hover:text-cf-red'
                                }`}
                        >
                            Upload
                        </Link>
                    </div>

                    <div className="flex items-center space-x-4">
                        {isAuthenticated && user ? (
                            <>
                                {user.picture && (
                                    <img
                                        src={user.picture}
                                        alt={user.name}
                                        className="w-10 h-10 rounded-full"
                                    />
                                )}
                                <button
                                    onClick={logout}
                                    className="text-sm font-semibold uppercase tracking-wider text-black hover:text-cf-red transition-colors"
                                >
                                    Logout
                                </button>
                            </>
                        ) : (
                            <span className="text-sm text-gray-600">Not signed in</span>
                        )}
                    </div>
                </div>
            </div>
        </nav>
    );
}

