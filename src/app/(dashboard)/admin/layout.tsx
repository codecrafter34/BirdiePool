export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
      {children}
    </div>
  );
}
