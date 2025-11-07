export default function RootLaout(props: { children: React.ReactNode }) {
  return (
    <>
      <div id="rootLayout" className="grid grid-cols-[230px_1fr] grid-rows-1">
        <nav className="silder"></nav>
        <main className="w-full min-h-screen">{props.children}</main>
      </div>
    </>
  );
}
