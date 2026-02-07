import Sidebar from './Sidebar';
import Header from './Header';

function DashboardLayout({ children }) {
  return (
    <div className="flex h-screen bg-gray-50 overflow-hidden" dir="rtl">
      <div className="flex-shrink-0">
        <Sidebar />
      </div>
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        <Header />
        <main className="flex-1 p-6 overflow-y-auto">
          {children}
        </main>
      </div>
    </div>
  );
}

export default DashboardLayout;
