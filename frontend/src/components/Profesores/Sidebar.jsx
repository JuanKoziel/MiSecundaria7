import { useState, useRef, useEffect } from 'react';
import { menuItems, bottomItems } from './sidebarMenu';
import Logo from '../Shared/Logo';
import CambiarRolButton from '../Shared/CambiarRolButton';
import CampanaNotificaciones from '../Shared/CampanaNotificaciones';

function Sidebar({ view, setView, onLogout }) {
  const [expandedSection, setExpandedSection] = useState('gestion-academica');
  const menuWrapperRef = useRef(null);

  const toggleSection = (sectionId) => {
    const willExpand = expandedSection !== sectionId;
    setExpandedSection(willExpand ? sectionId : null);

    if (willExpand && menuWrapperRef.current) {
      // Wait for the DOM to update (animation) then scroll
      requestAnimationFrame(() => {
        const sectionHeader = menuWrapperRef.current.querySelector(
          `[data-section-id="${sectionId}"]`
        );
        if (sectionHeader) {
          const wrapper = menuWrapperRef.current;
          const headerRect = sectionHeader.getBoundingClientRect();
          const wrapperRect = wrapper.getBoundingClientRect();
          
          // Check if header is visible, if not scroll to it
          if (headerRect.bottom > wrapperRect.bottom || headerRect.top < wrapperRect.top) {
            sectionHeader.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
          }
        }
      });
    }
  };

  const isSectionExpanded = (sectionId) => expandedSection === sectionId;

  const renderMenuItems = () => {
    return menuItems.map((item) => {
      if (item.children) {
        const isExpanded = isSectionExpanded(item.id);
        const hasActiveChild = item.children.some(child => view === child.id);
        
        return (
          <li key={item.id} className="sidebar-menu-section" data-section-id={item.id}>
            <button
              type="button"
              className={`sidebar-menu-btn sidebar-section-header ${hasActiveChild ? 'active' : ''} ${isExpanded ? 'expanded' : ''}`}
              onClick={() => toggleSection(item.id)}
            >
              <i className={`fas ${item.icon}`} aria-hidden="true" />
              <span>{item.label}</span>
              <i className={`fas fa-chevron-down sidebar-chevron ${isExpanded ? 'rotated' : ''}`} aria-hidden="true" />
            </button>
            {isExpanded && (
              <ul className="sidebar-submenu" role="group" aria-label={item.label}>
                {item.children.map((child) => (
                  <li key={child.id} className={view === child.id ? 'active' : ''}>
                    <button
                      type="button"
                      className="sidebar-menu-btn sidebar-submenu-btn"
                      onClick={() => setView(child.id)}
                    >
                      <i className={`fas ${child.icon}`} aria-hidden="true" />
                      <span>{child.label}</span>
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </li>
        );
      }
      return (
        <li key={item.id} className={view === item.id ? 'active' : ''}>
          <button
            type="button"
            className="sidebar-menu-btn"
            onClick={() => setView(item.id)}
          >
            <i className={`fas ${item.icon}`} aria-hidden="true" />
            <span>{item.label}</span>
          </button>
        </li>
      );
    });
  };

  return (
    <aside className="sidebar">
      <div className="sidebar-brand">
        <Logo />
        <span>MiSecundaria 7</span>
      </div>

      <div className="sidebar-menu-wrapper" ref={menuWrapperRef}>
        <ul className="sidebar-menu">
          {renderMenuItems()}
        </ul>
      </div>

      <div className="sidebar-bottom-fixed">
        <ul className="sidebar-bottom-menu">
          {bottomItems.map((item) => (
            <li key={item.id} className={view === item.id ? 'active' : ''}>
              <button
                type="button"
                className="sidebar-menu-btn"
                onClick={() => setView(item.id)}
              >
                {item.id === 'notificaciones' ? (
                  <CampanaNotificaciones />
                ) : (
                  <i className={`fas ${item.icon}`} aria-hidden="true" />
                )}
                <span>{item.label}</span>
              </button>
            </li>
          ))}
        </ul>
        <div className="sidebar-logout">
          <CambiarRolButton />
          <button type="button" className="sidebar-menu-btn sidebar-logout-btn" onClick={onLogout}>
            <i className="fas fa-sign-out-alt" aria-hidden="true" />
            <span>Cerrar Sesión</span>
          </button>
        </div>
      </div>
    </aside>
  );
}

export default Sidebar;
