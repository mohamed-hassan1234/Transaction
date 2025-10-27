import React, { useEffect, useState, useRef } from "react";
import axios from "axios";
import { motion, AnimatePresence } from "framer-motion";
import { 
  FaReceipt, 
  FaSearch, 
  FaFilePdf, 
  FaFileExcel, 
  FaPrint, 
  FaFilter,
  FaUser,
  FaMoneyBillWave,
  FaCalendarAlt,
  FaChartBar,
  FaSync,
  FaDownload,
  FaArrowUp,
  FaArrowDown,
  FaEye,
  FaDollarSign,
  FaPhone,
  FaIdCard,
  FaBars,
  FaTimes,
  FaChevronDown,
  FaChevronUp
} from "react-icons/fa";
import { jsPDF } from "jspdf";
import * as XLSX from "xlsx";

const TaxLog = () => {
  const [logs, setLogs] = useState([]);
  const [clients, setClients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedClient, setSelectedClient] = useState("");
  const [dateRange, setDateRange] = useState({ start: "", end: "" });
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [expandedLog, setExpandedLog] = useState(null);
  const [taxStats, setTaxStats] = useState({
    totalProfit: 0,
    averageProfit: 0,
    totalTransactions: 0,
    highestProfit: 0
  });

  const tableRef = useRef();

  useEffect(() => {
    fetchLogs();
    fetchClients();
  }, []);

  const fetchLogs = async () => {
    setLoading(true);
    setIsRefreshing(true);
    try {
      const res = await axios.get("http://localhost:5001/api/taxlogs", {
        headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
      });
      setLogs(res.data);
      calculateStats(res.data);
    } catch (err) {
      setMessage("❌ Failed to fetch tax logs");
    } finally {
      setLoading(false);
      setIsRefreshing(false);
    }
  };

  const fetchClients = async () => {
    try {
      const res = await axios.get("http://localhost:5001/api/clients", {
        headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
      });
      setClients(res.data);
    } catch (err) {
      console.error("Failed to fetch clients", err);
    }
  };

  const calculateStats = (taxLogs) => {
    const stats = taxLogs.reduce((acc, log) => {
      const profit = Number(log.profit || 0);
      acc.totalProfit += profit;
      acc.totalTransactions++;
      acc.highestProfit = Math.max(acc.highestProfit, profit);
      return acc;
    }, { totalProfit: 0, totalTransactions: 0, highestProfit: 0 });

    stats.averageProfit = stats.totalTransactions > 0 ? stats.totalProfit / stats.totalTransactions : 0;
    setTaxStats(stats);
  };

  // Enhanced search functionality
  const filteredLogs = logs.filter(log => {
    const searchLower = searchTerm.toLowerCase();
    
    const matchesSearch = 
      // Search by sender name
      log.senderClient?.fullName?.toLowerCase().includes(searchLower) ||
      // Search by sender phone
      log.senderClient?.phone?.includes(searchTerm) ||
      // Search by sender national ID
      log.senderClient?.nationalId?.includes(searchTerm) ||
      // Search by receiver name
      log.receiverClient?.fullName?.toLowerCase().includes(searchLower) ||
      // Search by receiver phone
      log.receiverClient?.phone?.includes(searchTerm) ||
      // Search by receiver national ID
      log.receiverClient?.nationalId?.includes(searchTerm) ||
      // Search by method
      log.method?.toLowerCase().includes(searchLower) ||
      // Search by receipt number
      log.transactionId?.receiptNumber?.toString().includes(searchTerm) ||
      // Search by profit amount
      log.profit?.toString().includes(searchTerm);

    const matchesClient = !selectedClient || 
      log.senderClient?._id === selectedClient || 
      log.receiverClient?._id === selectedClient;

    const logDate = new Date(log.date);
    const matchesDateRange = 
      (!dateRange.start || logDate >= new Date(dateRange.start)) &&
      (!dateRange.end || logDate <= new Date(dateRange.end + "T23:59:59"));

    return matchesSearch && matchesClient && matchesDateRange;
  });

  // Get unique identifier for clients with same name
  const getClientIdentifier = (client) => {
    if (!client) return "Unknown";
    
    const clientsWithSameName = clients.filter(c => c.fullName === client.fullName);
    
    if (clientsWithSameName.length > 1) {
      // If multiple clients have same name, show phone number or national ID
      return `${client.fullName} (${client.phone || client.nationalId || client._id.slice(-4)})`;
    }
    
    return client.fullName;
  };

  // Get client display info with unique identifier
  const getClientDisplayInfo = (client, type = "sender") => {
    if (!client) {
      return {
        displayName: type === "sender" ? "Situation Is Not Happen" : "Unknown",
        identifier: "",
        phone: "-",
        nationalId: "-"
      };
    }

    const clientsWithSameName = clients.filter(c => c.fullName === client.fullName);
    let identifier = "";
    
    if (clientsWithSameName.length > 1) {
      identifier = client.phone || client.nationalId || `ID: ${client._id.slice(-4)}`;
    }

    return {
      displayName: client.fullName,
      identifier,
      phone: client.phone || "-",
      nationalId: client.nationalId || "-"
    };
  };

  // Safe string truncation function
  const safeSubstring = (str, length = 15) => {
    if (!str) return "N/A";
    return str.length > length ? str.substring(0, length) + "..." : str;
  };

  // Export to PDF - FIXED VERSION
  const exportToPDF = () => {
    try {
      const doc = new jsPDF();
      
      // Header
      doc.setFontSize(20);
      doc.text("Tax Logs Report", 20, 20);
      doc.setFontSize(12);
      doc.text(`Generated on: ${new Date().toLocaleDateString()}`, 20, 30);
      doc.text(`Total Records: ${filteredLogs.length}`, 20, 40);
      
      // Stats
      doc.text(`Total Profit: $${taxStats.totalProfit.toFixed(2)}`, 20, 55);
      doc.text(`Average Profit: $${taxStats.averageProfit.toFixed(2)}`, 20, 65);
      
      // Table headers
      let yPosition = 85;
      const headers = ["Sender", "Receiver", "Profit", "Method", "Date", "Receipt #"];
      const columnWidths = [30, 30, 20, 25, 30, 25];
      
      // Draw table headers
      doc.setFontSize(10);
      doc.setFont(undefined, 'bold');
      headers.forEach((header, index) => {
        doc.text(header, 20 + columnWidths.slice(0, index).reduce((a, b) => a + b, 0), yPosition);
      });
      
      yPosition += 10;
      
      // Table data
      doc.setFont(undefined, 'normal');
      filteredLogs.forEach((log, index) => {
        // Add new page if needed
        if (yPosition > 270) {
          doc.addPage();
          yPosition = 20;
          
          // Redraw headers on new page
          doc.setFont(undefined, 'bold');
          headers.forEach((header, headerIndex) => {
            doc.text(header, 20 + columnWidths.slice(0, headerIndex).reduce((a, b) => a + b, 0), yPosition);
          });
          yPosition += 10;
          doc.setFont(undefined, 'normal');
        }
        
        const senderInfo = getClientDisplayInfo(log.senderClient, "sender");
        const receiverInfo = getClientDisplayInfo(log.receiverClient, "receiver");
        
        // Safe data preparation
        const rowData = [
          safeSubstring(senderInfo.displayName, 12),
          safeSubstring(receiverInfo.displayName, 12),
          `$${Number(log.profit || 0).toFixed(2)}`,
          safeSubstring(log.method, 8),
          new Date(log.date).toLocaleDateString(),
          log.transactionId?.receiptNumber?.toString() || "-"
        ];
        
        // Draw row data
        rowData.forEach((data, dataIndex) => {
          const xPosition = 20 + columnWidths.slice(0, dataIndex).reduce((a, b) => a + b, 0);
          doc.text(data.toString(), xPosition, yPosition);
        });
        
        yPosition += 8;
        
        // Add a small gap every 5 rows for readability
        if ((index + 1) % 5 === 0) {
          yPosition += 5;
        }
      });

      // Add summary at the end
      if (yPosition < 250) {
        yPosition += 15;
        doc.setFont(undefined, 'bold');
        doc.text("Summary", 20, yPosition);
        yPosition += 7;
        doc.setFont(undefined, 'normal');
        doc.text(`Total Transactions: ${filteredLogs.length}`, 20, yPosition);
        yPosition += 5;
        doc.text(`Total Profit: $${taxStats.totalProfit.toFixed(2)}`, 20, yPosition);
      }

      doc.save(`tax-logs-report-${new Date().toISOString().split('T')[0]}.pdf`);
      
      setMessage("✅ PDF exported successfully!");
    } catch (error) {
      console.error("PDF Export Error:", error);
      setMessage("❌ Failed to export PDF. Please try again.");
    }
  };

  // Export to Excel
  const exportToExcel = () => {
    try {
      const worksheet = XLSX.utils.json_to_sheet(
        filteredLogs.map(log => {
          const senderInfo = getClientDisplayInfo(log.senderClient, "sender");
          const receiverInfo = getClientDisplayInfo(log.receiverClient, "receiver");
          
          return {
            'Sender Name': senderInfo.displayName,
            'Sender Phone': senderInfo.phone,
            'Sender National ID': senderInfo.nationalId,
            'Receiver Name': receiverInfo.displayName,
            'Receiver Phone': receiverInfo.phone,
            'Receiver National ID': receiverInfo.nationalId,
            'Profit': Number(log.profit || 0),
            'Method': log.method,
            'Date': new Date(log.date).toLocaleString(),
            'Receipt Number': log.transactionId?.receiptNumber || "-"
          }
        })
      );
      
      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, "Tax Logs");
      XLSX.writeFile(workbook, `tax-logs-${new Date().toISOString().split('T')[0]}.xlsx`);
      
      setMessage("✅ Excel file exported successfully!");
    } catch (error) {
      console.error("Excel Export Error:", error);
      setMessage("❌ Failed to export Excel file. Please try again.");
    }
  };

  // Print functionality
  const handlePrint = () => {
    try {
      const printContent = tableRef.current.innerHTML;
      const originalContent = document.body.innerHTML;
      
      document.body.innerHTML = `
        <div class="p-6" style="font-family: Arial, sans-serif;">
          <h1 class="text-2xl font-bold mb-4">Tax Logs Report</h1>
          <p class="mb-2"><strong>Generated on:</strong> ${new Date().toLocaleDateString()}</p>
          <p class="mb-2"><strong>Total Records:</strong> ${filteredLogs.length}</p>
          <p class="mb-4"><strong>Total Profit:</strong> $${taxStats.totalProfit.toFixed(2)}</p>
          <div class="overflow-x-auto">
            ${printContent}
          </div>
        </div>
      `;
      
      window.print();
      document.body.innerHTML = originalContent;
      window.location.reload();
    } catch (error) {
      console.error("Print Error:", error);
      setMessage("❌ Failed to print. Please try again.");
    }
  };

  // Mobile Tax Log Card Component
  const TaxLogCard = ({ log }) => {
    const isExpanded = expandedLog === log._id;
    const senderInfo = getClientDisplayInfo(log.senderClient, "sender");
    const receiverInfo = getClientDisplayInfo(log.receiverClient, "receiver");
    
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        whileHover={{ scale: 1.02 }}
        className="bg-white rounded-xl shadow-lg p-4 mb-4 border border-gray-100"
      >
        <div 
          className="cursor-pointer"
          onClick={() => setExpandedLog(isExpanded ? null : log._id)}
        >
          {/* Header with basic info */}
          <div className="flex justify-between items-start mb-3">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-gradient-to-r from-green-500 to-blue-500 rounded-full flex items-center justify-center text-white font-bold">
                ${Number(log.profit || 0).toFixed(0)}
              </div>
              <div>
                <p className="font-semibold text-gray-800 text-sm">
                  {senderInfo.displayName}
                </p>
                <p className="text-xs text-gray-500">to {receiverInfo.displayName}</p>
              </div>
            </div>
            <div className="flex items-center space-x-2">
              <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-semibold bg-blue-100 text-blue-800">
                {log.method}
              </span>
              <div className="text-gray-400">
                {isExpanded ? <FaChevronUp size={12} /> : <FaChevronDown size={12} />}
              </div>
            </div>
          </div>

          {/* Basic info always visible */}
          <div className="grid grid-cols-2 gap-2 text-xs text-gray-600">
            <div className="flex items-center">
              <FaDollarSign className="mr-1 text-green-500" />
              <span className="font-semibold">${Number(log.profit || 0).toFixed(2)}</span>
            </div>
            <div className="flex items-center">
              <FaCalendarAlt className="mr-1 text-gray-400" />
              <span>{new Date(log.date).toLocaleDateString()}</span>
            </div>
          </div>
        </div>

        {/* Expandable Details */}
        <AnimatePresence>
          {isExpanded && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.3 }}
              className="mt-4 pt-4 border-t border-gray-100"
            >
              {/* Sender Details */}
              <div className="mb-3">
                <p className="text-xs font-semibold text-gray-500 mb-2">SENDER</p>
                <div className="flex items-center space-x-3 bg-red-50 p-2 rounded-lg">
                  <div className="w-8 h-8 bg-gradient-to-r from-red-500 to-orange-500 rounded-full flex items-center justify-center text-white text-xs font-bold">
                    {senderInfo.displayName?.charAt(0) || "S"}
                  </div>
                  <div className="flex-1">
                    <p className="font-semibold text-sm">{senderInfo.displayName}</p>
                    {senderInfo.phone !== "-" && (
                      <p className="text-xs text-gray-600 flex items-center">
                        <FaPhone className="mr-1" size={10} />
                        {senderInfo.phone}
                      </p>
                    )}
                  </div>
                </div>
              </div>

              {/* Receiver Details */}
              <div className="mb-3">
                <p className="text-xs font-semibold text-gray-500 mb-2">RECEIVER</p>
                <div className="flex items-center space-x-3 bg-green-50 p-2 rounded-lg">
                  <div className="w-8 h-8 bg-gradient-to-r from-green-500 to-emerald-500 rounded-full flex items-center justify-center text-white text-xs font-bold">
                    {receiverInfo.displayName?.charAt(0) || "R"}
                  </div>
                  <div className="flex-1">
                    <p className="font-semibold text-sm">{receiverInfo.displayName}</p>
                    {receiverInfo.phone !== "-" && (
                      <p className="text-xs text-gray-600 flex items-center">
                        <FaPhone className="mr-1" size={10} />
                        {receiverInfo.phone}
                      </p>
                    )}
                  </div>
                </div>
              </div>

              {/* Additional Details */}
              <div className="grid grid-cols-2 gap-3 text-xs">
                <div>
                  <p className="font-semibold text-gray-500">Method</p>
                  <p className="text-gray-800">{log.method}</p>
                </div>
                <div>
                  <p className="font-semibold text-gray-500">Receipt</p>
                  <p className="text-gray-800">
                    {log.transactionId?.receiptNumber ? `#${log.transactionId.receiptNumber}` : "-"}
                  </p>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex justify-center space-x-2 mt-4 pt-3 border-t border-gray-100">
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  className="flex items-center gap-1 px-3 py-1 bg-blue-500 text-white rounded-lg text-xs shadow-md hover:shadow-lg transition-all duration-200"
                >
                  <FaEye size={10} />
                  View
                </motion.button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    );
  };

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1
      }
    }
  };

  const itemVariants = {
    hidden: { y: 20, opacity: 0 },
    visible: {
      y: 0,
      opacity: 1,
      transition: {
        type: "spring",
        stiffness: 100
      }
    }
  };

  const cardVariants = {
    hidden: { scale: 0.9, opacity: 0 },
    visible: {
      scale: 1,
      opacity: 1,
      transition: {
        type: "spring",
        stiffness: 300,
        damping: 25
      }
    },
    hover: {
      scale: 1.02,
      y: -5,
      boxShadow: "0 20px 40px rgba(0,0,0,0.1)",
      transition: {
        type: "spring",
        stiffness: 400
      }
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-50 via-white to-blue-50 flex items-center justify-center">
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
          className="w-16 h-16 border-4 border-green-500 border-t-transparent rounded-full"
        />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 via-white to-blue-50 p-3 sm:p-4 lg:p-6">
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="max-w-7xl mx-auto"
      >
        {/* Mobile Header */}
        <div className="lg:hidden mb-4">
          <div className="flex items-center justify-between">
            <div className="flex-1">
              <h1 className="text-xl font-bold bg-gradient-to-r from-green-600 to-blue-600 bg-clip-text text-transparent">
                Tax Logs
              </h1>
              <p className="text-xs text-gray-600 mt-1">
                {logs.length} transactions • ${taxStats.totalProfit.toFixed(2)} total
              </p>
            </div>
            <button
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="p-2 rounded-lg bg-white shadow-lg border border-gray-200 ml-2"
            >
              {isMobileMenuOpen ? <FaTimes size={16} /> : <FaBars size={16} />}
            </button>
          </div>
        </div>

        {/* Header Section - Hidden on mobile, shown on desktop */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-4 lg:mb-8 hidden lg:block"
        >
          <h1 className="text-3xl lg:text-5xl font-bold bg-gradient-to-r from-green-600 to-blue-600 bg-clip-text text-transparent mb-3 lg:mb-4">
            Tax Logs & Analytics
          </h1>
          <p className="text-base lg:text-xl text-gray-600 max-w-2xl mx-auto">
            Comprehensive tracking of all tax-related transactions with detailed analytics and reporting.
          </p>
        </motion.div>

        {/* Stats Cards - Improved mobile layout */}
        <motion.div
          variants={containerVariants}
          initial="hidden"
          animate="visible"
          className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-2 sm:gap-3 lg:gap-6 mb-4 lg:mb-8"
        >
          {[
            { 
              icon: <FaDollarSign className="text-green-500" />, 
              label: "Total Profit", 
              value: `$${taxStats.totalProfit.toFixed(2)}`, 
              color: "from-green-500 to-emerald-500" 
            },
            { 
              icon: <FaChartBar className="text-blue-500" />, 
              label: "Average", 
              value: `$${taxStats.averageProfit.toFixed(2)}`, 
              color: "from-blue-500 to-cyan-500" 
            },
            { 
              icon: <FaReceipt className="text-purple-500" />, 
              label: "Transactions", 
              value: taxStats.totalTransactions, 
              color: "from-purple-500 to-pink-500" 
            },
            { 
              icon: <FaMoneyBillWave className="text-orange-500" />, 
              label: "Highest", 
              value: `$${taxStats.highestProfit.toFixed(2)}`, 
              color: "from-orange-500 to-red-500" 
            }
          ].map((stat, index) => (
            <motion.div
              key={stat.label}
              variants={itemVariants}
              whileHover={cardVariants.hover}
              className={`bg-gradient-to-br ${stat.color} text-white p-2 sm:p-3 lg:p-6 rounded-lg sm:rounded-xl lg:rounded-2xl shadow-md lg:shadow-xl relative overflow-hidden group`}
            >
              <div className="absolute -right-2 -top-2 sm:-right-3 sm:-top-3 lg:-right-4 lg:-top-4 w-8 h-8 sm:w-12 sm:h-12 lg:w-20 lg:h-20 bg-white/10 rounded-full group-hover:scale-150 transition-transform duration-500"></div>
              <div className="relative z-10">
                <div className="text-sm sm:text-xl lg:text-3xl mb-1 sm:mb-2 lg:mb-3 transform group-hover:scale-110 transition-transform duration-300">
                  {stat.icon}
                </div>
                <p className="text-xs sm:text-lg lg:text-2xl font-bold truncate">{stat.value}</p>
                <p className="text-blue-100 text-xs sm:text-sm truncate">{stat.label}</p>
              </div>
            </motion.div>
          ))}
        </motion.div>

        {/* Control Panel - Improved mobile layout */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-white/80 backdrop-blur-lg rounded-lg sm:rounded-xl lg:rounded-2xl shadow-lg lg:shadow-xl p-3 sm:p-4 lg:p-6 mb-4 lg:mb-8 border border-white/20"
        >
          <div className={`flex flex-col space-y-3 sm:space-y-4 lg:space-y-0 lg:flex-row lg:gap-4 lg:items-center lg:justify-between ${isMobileMenuOpen ? 'block' : 'hidden lg:flex'}`}>
            {/* Search and Filters */}
            <div className="flex flex-col md:flex-row gap-3 flex-1">
              <div className="relative flex-1">
                <FaSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search tax logs..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 sm:py-3 bg-white border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all duration-300 text-sm sm:text-base"
                />
              </div>

              <select
                value={selectedClient}
                onChange={(e) => setSelectedClient(e.target.value)}
                className="px-3 py-2 sm:py-3 bg-white border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent text-sm sm:text-base"
              >
                <option value="">All Clients</option>
                {clients.map(client => (
                  <option key={client._id} value={client._id}>
                    {getClientIdentifier(client)}
                  </option>
                ))}
              </select>
            </div>

            {/* Action Buttons */}
            <div className="flex gap-2 sm:gap-3">
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={fetchLogs}
                disabled={isRefreshing}
                className="flex items-center gap-2 px-3 sm:px-4 lg:px-6 py-2 sm:py-3 bg-gradient-to-r from-gray-600 to-gray-700 text-white rounded-lg lg:rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 disabled:opacity-50 text-sm sm:text-base flex-1 lg:flex-none justify-center"
              >
                <FaSync className={`${isRefreshing ? 'animate-spin' : ''} text-xs sm:text-sm`} />
                <span className="hidden xs:inline">{isRefreshing ? 'Refreshing...' : 'Refresh'}</span>
              </motion.button>
            </div>
          </div>

          {/* Date Range Filter */}
          <div className="flex flex-col sm:flex-row gap-3 mt-3">
            <input
              type="date"
              value={dateRange.start}
              onChange={(e) => setDateRange({...dateRange, start: e.target.value})}
              className="px-3 py-2 bg-white border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent text-sm"
              placeholder="Start Date"
            />
            <input
              type="date"
              value={dateRange.end}
              onChange={(e) => setDateRange({...dateRange, end: e.target.value})}
              className="px-3 py-2 bg-white border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent text-sm"
              placeholder="End Date"
            />
          </div>

          {/* Search Tips - Simplified for mobile */}
          <div className="mt-3 text-xs text-gray-600">
            <p className="font-semibold text-sm">Search by:</p>
            <div className="flex flex-wrap gap-2 mt-1">
              <span className="flex items-center gap-1"><FaUser className="text-blue-500" /> Name</span>
              <span className="flex items-center gap-1"><FaPhone className="text-green-500" /> Phone</span>
              <span className="flex items-center gap-1"><FaReceipt className="text-orange-500" /> Receipt</span>
            </div>
          </div>

          {/* Export Buttons */}
          <div className="flex gap-2 mt-3 flex-wrap">
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={exportToPDF}
              className="flex items-center gap-2 px-3 sm:px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-all duration-300 shadow-lg text-sm flex-1 sm:flex-none justify-center"
            >
              <FaFilePdf size={14} />
              <span className="hidden sm:inline">PDF</span>
            </motion.button>
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={exportToExcel}
              className="flex items-center gap-2 px-3 sm:px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-all duration-300 shadow-lg text-sm flex-1 sm:flex-none justify-center"
            >
              <FaFileExcel size={14} />
              <span className="hidden sm:inline">Excel</span>
            </motion.button>
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={handlePrint}
              className="flex items-center gap-2 px-3 sm:px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-all duration-300 shadow-lg text-sm flex-1 sm:flex-none justify-center"
            >
              <FaPrint size={14} />
              <span className="hidden sm:inline">Print</span>
            </motion.button>
          </div>

          {/* Message Alert */}
          <AnimatePresence>
            {message && (
              <motion.div
                initial={{ opacity: 0, y: -10, scale: 0.9 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: -10, scale: 0.9 }}
                className={`mt-3 p-3 rounded-lg text-center font-semibold text-sm ${
                  message.startsWith("✅") 
                    ? "bg-green-100 text-green-700 border border-green-200" 
                    : "bg-red-100 text-red-700 border border-red-200"
                }`}
              >
                {message}
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>

        {/* Tax Logs List */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="bg-white/80 backdrop-blur-lg rounded-xl lg:rounded-2xl shadow-lg lg:shadow-xl overflow-hidden border border-white/20"
        >
          <div className="p-4 border-b border-gray-200">
            <div className="flex items-center justify-between">
              <h3 className="text-lg lg:text-2xl font-bold text-gray-800 flex items-center gap-2 lg:gap-3">
                <FaReceipt className="text-green-500" />
                <span className="hidden sm:inline">Tax Logs History</span>
                <span className="sm:hidden">Tax Logs</span>
                <span className="text-xs font-normal text-gray-500 bg-gray-100 px-2 py-1 rounded-full">
                  {filteredLogs.length}
                </span>
              </h3>
              
              {selectedClient && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="text-xs text-gray-600 bg-green-50 px-2 py-1 rounded-full hidden sm:block"
                >
                  Filtered for: {getClientIdentifier(clients.find(c => c._id === selectedClient))}
                </motion.div>
              )}
            </div>
            <div className="text-xs text-gray-500 mt-1 lg:hidden">
              Tap on a transaction to view details
            </div>
          </div>

          {/* Mobile View - Enhanced Cards */}
          <div className="lg:hidden p-3">
            {loading ? (
              <div className="flex justify-center items-center py-8">
                <motion.div
                  animate={{ rotate: 360 }}
                  transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                  className="w-6 h-6 border-3 border-green-500 border-t-transparent rounded-full"
                />
              </div>
            ) : (
              <AnimatePresence>
                {filteredLogs.length > 0 ? (
                  <motion.div
                    variants={containerVariants}
                    initial="hidden"
                    animate="visible"
                  >
                    {filteredLogs.map((log, index) => (
                      <TaxLogCard key={log._id} log={log} />
                    ))}
                  </motion.div>
                ) : (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="text-center py-8"
                  >
                    <div className="w-16 h-16 bg-gradient-to-r from-gray-200 to-gray-300 rounded-full flex items-center justify-center mx-auto mb-4">
                      <FaReceipt className="text-2xl text-gray-400" />
                    </div>
                    <h4 className="text-lg font-semibold text-gray-500 mb-2">No Tax Logs Found</h4>
                    <p className="text-gray-400 mb-4 text-sm">No tax logs match your current filters</p>
                    <motion.button
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={() => {
                        setSearchTerm("");
                        setSelectedClient("");
                        setDateRange({ start: "", end: "" });
                      }}
                      className="bg-gradient-to-r from-green-500 to-blue-600 text-white px-4 py-2 rounded-lg shadow-lg hover:shadow-xl transition-all duration-300 text-sm"
                    >
                      Clear Filters
                    </motion.button>
                  </motion.div>
                )}
              </AnimatePresence>
            )}
          </div>

          {/* Desktop View - Table */}
          <div className="hidden lg:block overflow-x-auto" ref={tableRef}>
            {loading ? (
              <div className="flex justify-center items-center py-12">
                <motion.div
                  animate={{ rotate: 360 }}
                  transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                  className="w-8 h-8 border-4 border-green-500 border-t-transparent rounded-full"
                />
              </div>
            ) : (
              <table className="w-full">
                <thead>
                  <tr className="bg-gradient-to-r from-gray-50 to-green-50">
                    {["Sender", "Receiver", "Profit", "Method", "Date", "Receipt #"].map((header) => (
                      <th key={header} className="px-6 py-4 text-left text-sm font-semibold text-gray-700 uppercase tracking-wider">
                        {header}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  <AnimatePresence>
                    {filteredLogs.map((log, index) => {
                      const senderInfo = getClientDisplayInfo(log.senderClient, "sender");
                      const receiverInfo = getClientDisplayInfo(log.receiverClient, "receiver");
                      
                      return (
                        <motion.tr
                          key={log._id}
                          initial={{ opacity: 0, x: -20 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: index * 0.03 }}
                          whileHover={{ backgroundColor: "rgba(34, 197, 94, 0.05)" }}
                          className="group transition-all duration-300"
                        >
                          {/* Sender */}
                          <td className="px-6 py-4">
                            <div className="flex items-center">
                              <div className="w-10 h-10 bg-gradient-to-r from-red-500 to-orange-500 rounded-full flex items-center justify-center text-white font-bold mr-3">
                                {senderInfo.displayName?.charAt(0) || "S"}
                              </div>
                              <div>
                                <p className="font-semibold text-gray-800">
                                  {senderInfo.displayName}
                                </p>
                                <div className="flex flex-col text-sm text-gray-500">
                                  {senderInfo.phone !== "-" && (
                                    <span className="flex items-center gap-1">
                                      <FaPhone className="text-xs" /> {senderInfo.phone}
                                    </span>
                                  )}
                                  {senderInfo.identifier && (
                                    <span className="text-xs text-blue-600 font-medium">
                                      {senderInfo.identifier}
                                    </span>
                                  )}
                                </div>
                              </div>
                            </div>
                          </td>

                          {/* Receiver */}
                          <td className="px-6 py-4">
                            <div className="flex items-center">
                              <div className="w-10 h-10 bg-gradient-to-r from-green-500 to-emerald-500 rounded-full flex items-center justify-center text-white font-bold mr-3">
                                {receiverInfo.displayName?.charAt(0) || "R"}
                              </div>
                              <div>
                                <p className="font-semibold text-gray-800">
                                  {receiverInfo.displayName}
                                </p>
                                <div className="flex flex-col text-sm text-gray-500">
                                  {receiverInfo.phone !== "-" && (
                                    <span className="flex items-center gap-1">
                                      <FaPhone className="text-xs" /> {receiverInfo.phone}
                                    </span>
                                  )}
                                  {receiverInfo.identifier && (
                                    <span className="text-xs text-blue-600 font-medium">
                                      {receiverInfo.identifier}
                                    </span>
                                  )}
                                </div>
                              </div>
                            </div>
                          </td>

                          {/* Profit */}
                          <td className="px-6 py-4">
                            <div className="flex items-center">
                              <FaDollarSign className="text-green-500 mr-2" />
                              <span className="font-bold text-green-600 text-lg">
                                ${Number(log.profit || 0).toFixed(2)}
                              </span>
                            </div>
                          </td>

                          {/* Method */}
                          <td className="px-6 py-4">
                            <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-semibold bg-blue-100 text-blue-800">
                              {log.method}
                            </span>
                          </td>

                          {/* Date */}
                          <td className="px-6 py-4">
                            <div className="flex items-center text-gray-600">
                              <FaCalendarAlt className="mr-2 text-gray-400" />
                              {new Date(log.date).toLocaleString()}
                            </div>
                          </td>

                          {/* Receipt Number */}
                          <td className="px-6 py-4">
                            {log.transactionId?.receiptNumber ? (
                              <span className="font-mono text-sm bg-gray-100 px-2 py-1 rounded text-gray-700">
                                #{log.transactionId.receiptNumber}
                              </span>
                            ) : (
                              <span className="text-gray-400 italic">-</span>
                            )}
                          </td>
                        </motion.tr>
                      );
                    })}
                  </AnimatePresence>
                </tbody>
              </table>
            )}

            {filteredLogs.length === 0 && !loading && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="text-center py-12"
              >
                <div className="w-24 h-24 bg-gradient-to-r from-gray-200 to-gray-300 rounded-full flex items-center justify-center mx-auto mb-4">
                  <FaReceipt className="text-3xl text-gray-400" />
                </div>
                <h4 className="text-xl font-semibold text-gray-500 mb-2">No Tax Logs Found</h4>
                <p className="text-gray-400 mb-4">No tax logs match your current filters</p>
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => {
                    setSearchTerm("");
                    setSelectedClient("");
                    setDateRange({ start: "", end: "" });
                  }}
                  className="bg-gradient-to-r from-green-500 to-blue-600 text-white px-6 py-3 rounded-xl shadow-lg hover:shadow-xl transition-all duration-300"
                >
                  Clear Filters
                </motion.button>
              </motion.div>
            )}
          </div>
        </motion.div>
      </motion.div>

      {/* Background Decorations */}
      <div className="fixed inset-0 -z-10 overflow-hidden">
        <div className="absolute -top-40 -right-40 w-60 h-60 lg:w-80 lg:h-80 bg-green-200 rounded-full blur-3xl opacity-30 animate-pulse"></div>
        <div className="absolute -bottom-40 -left-40 w-60 h-60 lg:w-80 lg:h-80 bg-blue-200 rounded-full blur-3xl opacity-30 animate-pulse delay-1000"></div>
      </div>
    </div>
  );
};

export default TaxLog;