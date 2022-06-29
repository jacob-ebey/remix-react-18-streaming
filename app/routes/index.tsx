import { Link } from "@remix-run/react";

export let loader = async () => {
  await new Promise((resolve) => setTimeout(resolve, 1000));
  return null;
};

export default function Index() {
  return (
    <main className="container">
      <h1>Remix + React 18</h1>
      <p>Ready from day one with minimal to no changes to your codebase.</p>

      <ul>
        <li>
          <Link to="/upgrading">Upgrading</Link>
        </li>
        <li>
          <Link to="/lazy">React.lazy</Link>
        </li>
      </ul>
    </main>
  );
}
