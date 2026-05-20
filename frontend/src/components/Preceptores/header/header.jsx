import "./header.css";

function Header({ user }) {
  return (
    <header>
      <h2>Bienvenido {user.username}</h2>
      <span>{user.role}</span>
    </header>
  );
}

export default Header;