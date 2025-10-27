// Dashboard.jsx
import React, { useState, useEffect } from "react";
import {
  FaHome,
  FaUser,
  FaChartBar,
  FaCog,
  FaBars,
  FaExchangeAlt,
  FaReceipt,
  FaChevronLeft,
  FaChevronRight,
  FaTimes,
  FaUserCircle,
  FaUsers,
  FaMoneyBillWave,
  FaHandshake
} from "react-icons/fa";
import Guarantor from "../components/Guarantor";
import Client from "../components/Client";
import Transaction from "../components/Transaction";
import Setting from "../components/Setting";
import TaxLog from "../components/TaxLog";
import Dash from "../components/Dash";
import Profile from "../components/Profile";
import Withdraw from "../components/Withdraw";

const Dashboard = () => {
  const [activePage, setActivePage] = useState("home");
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [isMobile, setIsMobile] = useState(false);
  const [contentLoading, setContentLoading] = useState(false);

  // Check screen size and device type
  useEffect(() => {
    const checkScreenSize = () => {
      const mobile = window.innerWidth < 768;
      setIsMobile(mobile);
      
      // Auto-close sidebar on mobile, keep open on desktop
      if (mobile) {
        setSidebarOpen(false);
      } else {
        setSidebarOpen(true);
      }
    };

    checkScreenSize();
    window.addEventListener('resize', checkScreenSize);
    return () => window.removeEventListener('resize', checkScreenSize);
  }, []);

  const handlePageChange = (page) => {
    setContentLoading(true);
    setTimeout(() => {
      setActivePage(page);
      setContentLoading(false);
      // Auto-close sidebar on mobile after selection
      if (isMobile) setSidebarOpen(false);
    }, 300);
  };

  const toggleSidebar = () => {
    setSidebarOpen(!sidebarOpen);
  };

  const renderContent = () => {
    const content = (() => {
      switch (activePage) {
        case "home":
          return (
            <Dash/>
          );
        case "users":
          return <Guarantor />;
        case "analytics":
          return <Client />;
        case "Withdraw":
          return <Withdraw />;
        case "Transaction":
          return <Transaction />;
        case "Settings":
          return <Setting />;
        case "TaxLog":
          return <TaxLog />;
        case "Profile":
          return <Profile />;
        default:
          return <div>Select a menu item</div>;
      }
    })();

    return (
      <div className={`transition-all duration-500 ${contentLoading ? 'opacity-0 scale-95' : 'opacity-100 scale-100'}`}>
        {content}
      </div>
    );
  };

  const menuItems = [
    { key: "home", icon: FaHome, label: "Dashboard" },
    { key: "users", icon: FaUser, label: "Guarantor" },
    { key: "analytics", icon: FaHandshake, label: "Client" },
    { key: "Transaction", icon: FaExchangeAlt, label: "Transaction" },
    { key: "Withdraw", icon: FaMoneyBillWave, label: "Withdraw" },
    { key: "TaxLog", icon: FaReceipt, label: "Tax Log" },
    { key: "Profile", icon: FaUserCircle, label: "Profile" },
    { key: "Settings", icon: FaCog, label: "Settings" },
  ];

  return (
    <div className="flex min-h-screen bg-gradient-to-br from-gray-50 to-blue-50 relative overflow-hidden">
      {/* Animated background elements */}
      <div className="absolute top-0 left-0 w-72 h-72 bg-purple-300 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-pulse"></div>
      <div className="absolute bottom-0 right-0 w-72 h-72 bg-blue-300 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-pulse animation-delay-2000"></div>
      <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-72 h-72 bg-amber-300 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-pulse animation-delay-4000"></div>

      {/* Mobile Overlay */}
      {isMobile && sidebarOpen && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 z-20 transition-opacity duration-300"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar - Different behavior for mobile vs desktop */}
      <div
        className={`fixed h-screen transition-all duration-500 flex flex-col z-30 border-r border-white/20 overflow-hidden ${
          isMobile
            ? sidebarOpen
              ? "w-64 md:w-72 translate-x-0" // Full sidebar open on mobile
              : "-translate-x-full" // Completely hidden on mobile
            : sidebarOpen
              ? "w-64 md:w-72 translate-x-0" // Full sidebar on desktop
              : "w-16 translate-x-0" // Icon bar on desktop
        } bg-white/95 backdrop-blur-xl shadow-2xl`}
      >
        {/* Sidebar background gradient */}
        <div className="absolute inset-0 bg-gradient-to-b from-white to-blue-50/30 z-0"></div>
        
        {/* Header */}
        <div className="flex items-center justify-between p-4 sm:p-6 border-b border-white/20 relative z-10">
          {/* Show name only when sidebar is open (both mobile and desktop) */}
          <span className={`text-xl sm:text-2xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent ${
            !sidebarOpen && "hidden"
          }`}>
           Company Dash
          </span>
          
          {/* Close button - different icons based on state */}
          <button
            className="text-gray-600 hover:text-blue-600 transition-colors duration-300 p-2 rounded-xl hover:bg-white/50 backdrop-blur-sm flex-shrink-0"
            onClick={toggleSidebar}
          >
            {isMobile ? (
              <FaTimes className="text-lg" />
            ) : (
              sidebarOpen ? <FaChevronLeft /> : <FaBars />
            )}
          </button>
        </div>

        {/* Navigation Menu */}
        <nav className="flex-1 mt-4 sm:mt-6 relative z-10">
          <ul className="space-y-1 sm:space-y-2 px-2 sm:px-4">
            {menuItems.map((item) => {
              const Icon = item.icon;
              const isActive = activePage === item.key;
              
              return (
                <li
                  key={item.key}
                  className={`flex items-center p-3 sm:p-4 cursor-pointer rounded-xl sm:rounded-2xl transition-all duration-300 group ${
                    isActive
                      ? "bg-gradient-to-r from-blue-500 to-purple-500 text-white shadow-lg" 
                      : "text-gray-600 hover:bg-white/50 hover:shadow-md"
                  } ${
                    sidebarOpen ? "justify-start" : "justify-center"
                  }`}
                  onClick={() => handlePageChange(item.key)}
                >
                  {/* Icon */}
                  <div className="relative">
                    <Icon className={`text-base sm:text-lg ${
                      isActive ? 'text-white' : 'text-gray-400 group-hover:text-blue-500'
                    }`} />
                    
                    {/* Active indicator dot for collapsed sidebar on desktop */}
                    {!sidebarOpen && !isMobile && isActive && (
                      <div className="absolute -top-1 -right-1 w-2 h-2 bg-green-400 rounded-full border-2 border-white"></div>
                    )}
                  </div>
                  
                  {/* Menu text - show when sidebar is open (both mobile and desktop) */}
                  <span className={`font-medium transition-all duration-300 ${
                    !sidebarOpen ? "hidden" : "ml-3 sm:ml-4"
                  } text-sm sm:text-base`}>
                    {item.label}
                  </span>
                  
                  {/* Tooltip for collapsed sidebar on desktop only */}
                  {!sidebarOpen && !isMobile && (
                    <div className="absolute left-14 bg-gray-900 text-white text-xs sm:text-sm px-2 py-1 rounded-md opacity-0 group-hover:opacity-100 transition-opacity duration-300 z-20 whitespace-nowrap shadow-lg">
                      {item.label}
                      {isActive && " ✓"}
                    </div>
                  )}
                </li>
              );
            })}
          </ul>
        </nav>

        {/* User Profile Section - Show when sidebar is open (both mobile and desktop) */}
        {/* {sidebarOpen && (
          <div className="p-3 sm:p-4 border-t border-white/20 relative z-10">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 sm:w-10 sm:h-10 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full flex items-center justify-center text-white font-bold text-sm sm:text-base flex-shrink-0">
                JD
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-gray-800 text-sm sm:text-base truncate">John Doe</p>
                <p className="text-xs sm:text-sm text-gray-500 truncate">Administrator</p>
              </div>
            </div>
          </div>
        )} */}
      </div>

      {/* Main Content Area */}
      <div 
        className={`flex-1 transition-all duration-300 min-h-screen ${
          isMobile 
            ? "ml-0" // No margin on mobile (sidebar hidden)
            : sidebarOpen 
              ? "ml-64 md:ml-72" // Full sidebar margin
              : "ml-16" // Icon bar margin
        }`}
      >
        <div className="p-3 sm:p-4 md:p-6 lg:p-8 overflow-auto">
          {/* Mobile Header - Always show hamburger to open sidebar */}
          {isMobile && (
            <div className="flex items-center justify-between mb-4 sm:mb-6 bg-white/80 backdrop-blur-sm rounded-2xl p-3 sm:p-4 shadow-lg border border-white/20">
              <button
                className="text-gray-600 p-2 rounded-xl bg-white/50 hover:bg-white/70 transition-colors duration-300"
                onClick={toggleSidebar}
              >
                <FaBars className="text-lg" />
              </button>
              <h1 className="text-lg sm:text-xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent text-center flex-1 mx-4">
                {menuItems.find(item => item.key === activePage)?.label || 'Dashboard'}
              </h1>
              {/* <div className="w-8 h-8 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full flex-shrink-0"></div> */}
            </div>
          )}

          {/* Desktop Header - Show when sidebar is collapsed */}
          {!isMobile && !sidebarOpen && (
            <div className="flex items-center justify-between mb-6 bg-white/80 backdrop-blur-sm rounded-2xl p-4 shadow-lg border border-white/20">
              <h1 className="text-xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                {menuItems.find(item => item.key === activePage)?.label || 'Dashboard'}
              </h1>
              <button
                className="text-gray-600 p-2 rounded-xl bg-white/50 hover:bg-white/70 transition-colors duration-300"
                onClick={toggleSidebar}
              >
                <FaBars className="text-lg" />
              </button>
            </div>
          )}

          {/* Loading Skeleton */}
          {contentLoading && (
            <div className="animate-pulse space-y-4">
              <div className="h-6 sm:h-8 bg-gray-200 rounded w-1/2 sm:w-1/3"></div>
              <div className="grid grid-cols-1 xs:grid-cols-2 lg:grid-cols-3 gap-4">
                {[1, 2, 3].map(i => (
                  <div key={i} className="h-24 sm:h-32 bg-gray-200 rounded-2xl"></div>
                ))}
              </div>
            </div>
          )}

          {/* Main Content */}
          {renderContent()}
        </div>
      </div>

      {/* Floating Action Button for Mobile - Show when sidebar is closed */}
      {isMobile && !sidebarOpen && (
        <button
          className="fixed bottom-6 right-6 w-12 h-12 sm:w-14 sm:h-14 bg-gradient-to-r from-blue-500 to-purple-500 text-white rounded-full shadow-2xl flex items-center justify-center z-20 transform hover:scale-110 transition-transform duration-300"
          onClick={toggleSidebar}
        >
          <FaBars className="text-lg sm:text-xl" />
        </button>
      )}
    </div>
  );
};

export default Dashboard;