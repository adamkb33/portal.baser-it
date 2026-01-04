export function Footer() {
  return (
    <footer className="border-t border-footer-border lg:col-span-12 lg:grid lg:grid-cols-12 bg-footer-bg">
      <div className="hidden lg:col-span-2 lg:block"></div>

      <section className="p-2 lg:col-span-8">
        <span className="text-xs font-medium uppercase tracking-[0.12em] text-footer-text-muted">Footer</span>
        <p className="mt-2 text-[0.7rem] text-footer-text-muted">Footer content goes here</p>
      </section>

      <div className="hidden lg:col-span-2 lg:block"></div>
    </footer>
  );
}
