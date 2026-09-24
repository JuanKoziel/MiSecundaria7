import { useEffect, useState } from 'react';

function SidebarToggle() {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    document.body.classList.toggle('sidebar-open', open);
    return () => document.body.classList.remove('sidebar-open');
  }, [open]);

  useEffect(() => {
    const handleClick = (event) => {
      const target = event.target;
      if (target.closest('.hamburger')) return;
      if (target.closest('.sidebar')) {
        const control = target.closest('button, a');
        if (control && !control.classList.contains('sidebar-section-header')) {
          setOpen(false);
        }
        return;
      }
      setOpen(false);
    };
    document.addEventListener('click', handleClick);
    return () => document.removeEventListener('click', handleClick);
  }, []);

  return (
    <button
      type="button"
      className="hamburger"
      aria-label={open ? 'Cerrar menú de navegación' : 'Abrir menú de navegación'}
      aria-expanded={open}
      onClick={() => setOpen((value) => !value)}
    >
      <span />
      <span />
      <span />
    </button>
  );
}

export default SidebarToggle;
