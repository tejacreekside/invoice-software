import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import { useAuth } from '../auth';
import { API_BASE_URL } from '../api';

const navItems = [
  { path: '/invoices', label: 'Invoices' },
  { path: '/invoices/create', label: 'Create Invoice' },
  { path: '/customers', label: 'Customers' },
  { path: '/products', label: 'Products' },
  { path: '/pictured-invoices', label: 'Pictured Invoices' },
];

export default function Layout() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(word => word.charAt(0))
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  return (
    <div className="app-shell">
      <aside className="sidebar">
        <div className="sidebar-brand">
          <div className="brand">InvoicePro</div>
          <p className="brand-subtitle">Modern billing workspace</p>
        </div>
        <nav className="sidebar-nav">
          {navItems.map((item) => (
            <NavLink
              key={item.path}
              to={item.path}
              className={({ isActive }) => `nav-link${isActive ? ' active' : ''}`}
            >
              {item.label}
            </NavLink>
          ))}
        </nav>
        <div className="sidebar-user">
          <button className="user-profile-button" onClick={() => navigate('/profile')}>
            <div className="user-avatar">
              {user?.avatar ? (
                <img
                  src={`${API_BASE_URL}${user.avatar}`}
                  alt={user.name}
                  className="avatar-image"
                />
              ) : (
                <div className="avatar-initials">
                  {user ? getInitials(user.name) : 'U'}
                </div>
              )}
            </div>
            <div className="user-info">
              <div className="user-name">{user?.name || 'User'}</div>
              <div className="user-email">{user?.email || ''}</div>
            </div>
          </button>
          <button className="button button-ghost logout-button" onClick={handleLogout}>
            Logout
          </button>
        </div>
      </aside>
      <main className="main-content">
        <Outlet />
      </main>
    </div>
  );
}
