export default function Footer() {
  return (
    <footer className="bg-white border-t border-gray-200 py-6">
      <div className="container mx-auto px-4 max-w-6xl text-center text-gray-400 text-sm">
        Built with React, Spring Boot &amp; H2 &mdash; {new Date().getFullYear()}
      </div>
    </footer>
  );
}
