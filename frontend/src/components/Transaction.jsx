import React, { useState, useEffect, useRef } from "react";
import axios from "axios";
import { motion, AnimatePresence } from "framer-motion";
import { 
  FaExchangeAlt, 
  FaSearch, 
  FaFilePdf, 
  FaFileExcel, 
  FaPrint, 
  FaFilter,
  FaUser,
  FaMoneyBillWave,
  FaReceipt,
  FaCalendarAlt,
  FaPlus,
  FaSync,
  FaDownload,
  FaArrowUp,
  FaArrowDown,
  FaEye,
  FaChartLine,
  FaChevronLeft,
  FaChevronRight,
  FaBars,
  FaTimes,
  FaChevronDown,
  FaChevronUp
} from "react-icons/fa";
import { jsPDF } from "jspdf";
import * as XLSX from "xlsx";

const Transaction = () => {
  const [clients, setClients] = useState([]);
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [form, setForm] = useState({
    type: "credit",
    amount: "",
    senderClient: "",
    receiverClient: "",
    externalName: "",
    notes: "",
    date: "",
    time: ""
  });

  const [taxRate, setTaxRate] = useState(0);
  const [taxAmount, setTaxAmount] = useState(0);
  const [totalAmount, setTotalAmount] = useState(0);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedClient, setSelectedClient] = useState("");
  const [dateRange, setDateRange] = useState({ start: "", end: "" });
  const [showForm, setShowForm] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [expandedTransaction, setExpandedTransaction] = useState(null);
  const [transactionStats, setTransactionStats] = useState({
    totalCredit: 0,
    totalDebit: 0,
    totalTax: 0,
    netFlow: 0
  });

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [transactionsPerPage] = useState(5);

  const token = localStorage.getItem("token");
  const tableRef = useRef();

  // Fetch Clients
  const fetchClients = async () => {
    try {
      const res = await axios.get("/api/clients", {
        headers: { Authorization: `Bearer ${token}` },
      });
      setClients(res.data);
    } catch (err) {
      console.error("Failed to fetch clients", err);
    }
  };

  // Fetch Transactions
  const fetchTransactions = async () => {
    setLoading(true);
    setIsRefreshing(true);
    try {
      const res = await axios.get("/api/transactions", {
        headers: { Authorization: `Bearer ${token}` },
      });
      setTransactions(res.data);
      calculateStats(res.data);
    } catch (err) {
      console.error("Failed to fetch transactions", err);
    } finally {
      setLoading(false);
      setIsRefreshing(false);
    }
  };

  // Fetch Tax Rate
  const fetchTaxRate = async () => {
    try {
      const res = await axios.get("/api/settings/taxRate", {
        headers: { Authorization: `Bearer ${token}` },
      });
      setTaxRate(Number(res.data.value));
    } catch (err) {
      console.error("Failed to fetch tax rate", err);
      setTaxRate(0);
    }
  };

  useEffect(() => {
    fetchClients();
    fetchTransactions();
    fetchTaxRate();
    
    // Set current date and time as default
    const now = new Date();
    const currentDate = now.toISOString().split('T')[0];
    const currentTime = now.toTimeString().slice(0, 5);
    
    setForm(prev => ({
      ...prev,
      date: currentDate,
      time: currentTime
    }));
  }, []);

  // Calculate tax + total
  useEffect(() => {
    const amt = Number(form.amount) || 0;
    const tax = amt * taxRate;
    setTaxAmount(tax);
    setTotalAmount(form.type === "debit" ? amt + tax : amt - tax);
  }, [form.amount, taxRate, form.type]);

  // Calculate transaction statistics
  const calculateStats = (transactions) => {
    const stats = transactions.reduce((acc, transaction) => {
      if (transaction.type === "credit") {
        acc.totalCredit += transaction.amount;
      } else {
        acc.totalDebit += transaction.amount;
      }
      acc.totalTax += transaction.taxAmount || 0;
      return acc;
    }, { totalCredit: 0, totalDebit: 0, totalTax: 0 });

    stats.netFlow = stats.totalCredit - stats.totalDebit;
    setTransactionStats(stats);
  };

  // Handle input change
  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  // Submit Transaction
  const handleSubmit = async (e) => {
    e.preventDefault();
    setMessage("");
    setLoading(true);
    
    try {
      // Combine date and time into a single datetime string
      const transactionDateTime = `${form.date}T${form.time}:00`;
      
      const transactionData = {
        ...form,
        date: transactionDateTime,
        taxAmount: taxAmount,
        totalAmount: totalAmount
      };

      await axios.post("/api/transactions", transactionData, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setMessage("✅ Transaction created successfully!");
      setForm({
        type: "credit",
        amount: "",
        senderClient: "",
        receiverClient: "",
        externalName: "",
        notes: "",
        date: new Date().toISOString().split('T')[0],
        time: new Date().toTimeString().slice(0, 5)
      });
      setShowForm(false);
      setCurrentPage(1); // Reset to first page when new transaction is added
      fetchTransactions();
    } catch (err) {
      const errorMsg = err.response?.data?.message || "Failed to create transaction";
      setMessage(`❌ ${errorMsg}`);
    } finally {
      setLoading(false);
    }
  };

  // Filter transactions based on search criteria
  const filteredTransactions = transactions.filter(transaction => {
    const matchesSearch = 
      transaction.receiptNumber?.toString().includes(searchTerm) ||
      transaction.notes?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      transaction.externalName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      transaction.senderClient?.fullName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      transaction.receiverClient?.fullName?.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesClient = !selectedClient || 
      transaction.senderClient?._id === selectedClient || 
      transaction.receiverClient?._id === selectedClient;

    const transactionDate = new Date(transaction.date);
    const matchesDateRange = 
      (!dateRange.start || transactionDate >= new Date(dateRange.start)) &&
      (!dateRange.end || transactionDate <= new Date(dateRange.end + "T23:59:59"));

    return matchesSearch && matchesClient && matchesDateRange;
  });

  // Pagination logic
  const indexOfLastTransaction = currentPage * transactionsPerPage;
  const indexOfFirstTransaction = indexOfLastTransaction - transactionsPerPage;
  const currentTransactions = filteredTransactions.slice(indexOfFirstTransaction, indexOfLastTransaction);
  const totalPages = Math.ceil(filteredTransactions.length / transactionsPerPage);

  // Change page
  const paginate = (pageNumber) => setCurrentPage(pageNumber);

  const nextPage = () => {
    if (currentPage < totalPages) {
      setCurrentPage(currentPage + 1);
    }
  };

  const prevPage = () => {
    if (currentPage > 1) {
      setCurrentPage(currentPage - 1);
    }
  };

  // Get page numbers to display
  const getPageNumbers = () => {
    const pageNumbers = [];
    const maxPagesToShow = 5;
    
    if (totalPages <= maxPagesToShow) {
      for (let i = 1; i <= totalPages; i++) {
        pageNumbers.push(i);
      }
    } else {
      const startPage = Math.max(1, currentPage - 2);
      const endPage = Math.min(totalPages, startPage + maxPagesToShow - 1);
      
      for (let i = startPage; i <= endPage; i++) {
        pageNumbers.push(i);
      }
    }
    
    return pageNumbers;
  };

  // Mobile Transaction Card Component
  const TransactionCard = ({ transaction }) => {
    const isExpanded = expandedTransaction === transaction._id;
    const totalDisplay = transaction.type === "credit"
      ? (transaction.amount - transaction.taxAmount).toFixed(2)
      : (transaction.amount + transaction.taxAmount).toFixed(2);

    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        whileHover={{ scale: 1.02 }}
        className="bg-white rounded-xl shadow-lg p-4 mb-4 border border-gray-100"
      >
        <div 
          className="cursor-pointer"
          onClick={() => setExpandedTransaction(isExpanded ? null : transaction._id)}
        >
          {/* Header with basic info */}
          <div className="flex justify-between items-start mb-3">
            <div className="flex items-center space-x-3">
              <div className={`w-10 h-10 rounded-full flex items-center justify-center text-white font-bold ${
                transaction.type === "credit" 
                  ? "bg-gradient-to-r from-green-500 to-emerald-500" 
                  : "bg-gradient-to-r from-red-500 to-orange-500"
              }`}>
                {transaction.type === "credit" ? <FaArrowDown size={14} /> : <FaArrowUp size={14} />}
              </div>
              <div>
                <p className="font-semibold text-gray-800 text-sm">
                  #{transaction.receiptNumber}
                </p>
                <p className="text-xs text-gray-500">
                  ${transaction.amount.toFixed(2)}
                </p>
              </div>
            </div>
            <div className="flex items-center space-x-2">
              <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-semibold ${
                transaction.type === "credit" 
                  ? "bg-green-100 text-green-800" 
                  : "bg-red-100 text-red-800"
              }`}>
                {transaction.type}
              </span>
              <div className="text-gray-400">
                {isExpanded ? <FaChevronUp size={12} /> : <FaChevronDown size={12} />}
              </div>
            </div>
          </div>

          {/* Basic info always visible */}
          <div className="grid grid-cols-2 gap-2 text-xs text-gray-600">
            <div className="flex items-center">
              <FaMoneyBillWave className="mr-1 text-green-500" />
              <span className="font-semibold">${totalDisplay}</span>
            </div>
            <div className="flex items-center">
              <FaCalendarAlt className="mr-1 text-gray-400" />
              <span>{new Date(transaction.date).toLocaleDateString()}</span>
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
              {transaction.senderClient && (
                <div className="mb-3">
                  <p className="text-xs font-semibold text-gray-500 mb-2">SENDER</p>
                  <div className="flex items-center space-x-3 bg-red-50 p-2 rounded-lg">
                    <div className="w-8 h-8 bg-gradient-to-r from-red-500 to-orange-500 rounded-full flex items-center justify-center text-white text-xs font-bold">
                      S
                    </div>
                    <div className="flex-1">
                      <p className="font-semibold text-sm">{transaction.senderClient.fullName}</p>
                    </div>
                  </div>
                </div>
              )}

              {/* Receiver Details */}
              {transaction.receiverClient && (
                <div className="mb-3">
                  <p className="text-xs font-semibold text-gray-500 mb-2">RECEIVER</p>
                  <div className="flex items-center space-x-3 bg-green-50 p-2 rounded-lg">
                    <div className="w-8 h-8 bg-gradient-to-r from-green-500 to-emerald-500 rounded-full flex items-center justify-center text-white text-xs font-bold">
                      R
                    </div>
                    <div className="flex-1">
                      <p className="font-semibold text-sm">{transaction.receiverClient.fullName}</p>
                    </div>
                  </div>
                </div>
              )}

              {/* Type Of Money */}
              {transaction.externalName && (
                <div className="mb-3">
                  <p className="text-xs font-semibold text-gray-500 mb-1">TYPE OF MONEY</p>
                  <p className="text-sm text-gray-800">{transaction.externalName}</p>
                </div>
              )}

              {/* Additional Details */}
              <div className="grid grid-cols-2 gap-3 text-xs mb-3">
                <div>
                  <p className="font-semibold text-gray-500">Tax Amount</p>
                  <p className="text-gray-800">${transaction.taxAmount.toFixed(2)}</p>
                </div>
                <div>
                  <p className="font-semibold text-gray-500">Time</p>
                  <p className="text-gray-800">{new Date(transaction.date).toLocaleTimeString()}</p>
                </div>
              </div>

              {/* Notes */}
              {/* {transaction.notes && (
                <div className="mb-3">
                  <p className="text-xs font-semibold text-gray-500 mb-1">NOTES</p>
                  <p className="text-sm text-gray-800 bg-gray-50 p-2 rounded-lg">{transaction.notes}</p>
                </div>
              )} */}

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

  // Export to PDF
  const exportToPDF = () => {
    const doc = new jsPDF();
    const table = tableRef.current;
    
    doc.text("Transaction Report", 20, 20);
    doc.text(`Generated on: ${new Date().toLocaleDateString()}`, 20, 30);
    doc.text(`Total Records: ${filteredTransactions.length}`, 20, 40);
    
    let yPosition = 60;
    filteredTransactions.forEach((transaction, index) => {
      if (yPosition > 270) {
        doc.addPage();
        yPosition = 20;
      }
      
      doc.text(`${index + 1}. Receipt: ${transaction.receiptNumber}`, 20, yPosition);
      doc.text(`   Type: ${transaction.type} | Amount: $${transaction.amount}`, 20, yPosition + 7);
      doc.text(`   Date: ${new Date(transaction.date).toLocaleDateString()}`, 20, yPosition + 14);
      doc.text(`   Time: ${new Date(transaction.date).toLocaleTimeString()}`, 20, yPosition + 21);
      yPosition += 30;
    });

    doc.save(`transactions-report-${new Date().toISOString().split('T')[0]}.pdf`);
  };

  // Export to Excel
  const exportToExcel = () => {
    const worksheet = XLSX.utils.json_to_sheet(
      filteredTransactions.map(t => ({
        'Receipt #': t.receiptNumber,
        'Type': t.type,
        'Amount': t.amount,
        'Tax': t.taxAmount,
        'Total': t.type === 'credit' ? t.amount - t.taxAmount : t.amount + t.taxAmount,
        'Sender': t.senderClient?.fullName || '-',
        'Receiver': t.receiverClient?.fullName || '-',
        'Type Of Money': t.externalName || '-',
        'Notes': t.notes || '-',
        'Date': new Date(t.date).toLocaleDateString(),
        'Time': new Date(t.date).toLocaleTimeString()
      }))
    );
    
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Transactions");
    XLSX.writeFile(workbook, `transactions-${new Date().toISOString().split('T')[0]}.xlsx`);
  };

  // Print functionality
  const handlePrint = () => {
    const printContent = tableRef.current.innerHTML;
    const originalContent = document.body.innerHTML;
    
    document.body.innerHTML = `
      <div class="p-6">
        <h1 class="text-2xl font-bold mb-4">Transaction Report</h1>
        <p class="mb-4">Generated on: ${new Date().toLocaleDateString()}</p>
        ${printContent}
      </div>
    `;
    
    window.print();
    document.body.innerHTML = originalContent;
    window.location.reload();
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

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 p-3 sm:p-4 lg:p-6">
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
              <h1 className="text-xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                Transactions
              </h1>
              <p className="text-xs text-gray-600 mt-1">
                {transactions.length} transactions • ${transactionStats.netFlow.toFixed(2)} net flow
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
          <h1 className="text-3xl lg:text-5xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent mb-3 lg:mb-4">
            Transaction Management
          </h1>
          <p className="text-base lg:text-xl text-gray-600 max-w-2xl mx-auto">
            Track all financial transactions with real-time calculations, tax processing, and comprehensive reporting.
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
              icon: <FaArrowDown className="text-green-500" />, 
              label: "Credit", 
              value: `$${transactionStats.totalCredit.toFixed(2)}`, 
              color: "from-green-500 to-emerald-500" 
            },
            { 
              icon: <FaArrowUp className="text-red-500" />, 
              label: "Debit", 
              value: `$${transactionStats.totalDebit.toFixed(2)}`, 
              color: "from-red-500 to-orange-500" 
            },
            { 
              icon: <FaMoneyBillWave className="text-yellow-500" />, 
              label: "Tax", 
              value: `$${transactionStats.totalTax.toFixed(2)}`, 
              color: "from-yellow-500 to-amber-500" 
            },
            { 
              icon: <FaChartLine className="text-blue-500" />, 
              label: "Net Flow", 
              value: `$${transactionStats.netFlow.toFixed(2)}`, 
              color: transactionStats.netFlow >= 0 ? "from-blue-500 to-cyan-500" : "from-purple-500 to-pink-500" 
            }
          ].map((stat, index) => (
            <motion.div
              key={stat.label}
              variants={itemVariants}
              whileHover="hover"
              variants={cardVariants}
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
                  placeholder="Search transactions..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 sm:py-3 bg-white border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-300 text-sm sm:text-base"
                />
              </div>

              <select
                value={selectedClient}
                onChange={(e) => setSelectedClient(e.target.value)}
                className="px-3 py-2 sm:py-3 bg-white border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm sm:text-base"
              >
                <option value="">All Clients</option>
                {clients.map(client => (
                  <option key={client._id} value={client._id}>
                    {client.fullName}
                  </option>
                ))}
              </select>
            </div>

            {/* Action Buttons */}
            <div className="flex gap-2 sm:gap-3">
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={fetchTransactions}
                disabled={isRefreshing}
                className="flex items-center gap-2 px-3 sm:px-4 lg:px-6 py-2 sm:py-3 bg-gradient-to-r from-gray-600 to-gray-700 text-white rounded-lg lg:rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 disabled:opacity-50 text-sm sm:text-base flex-1 lg:flex-none justify-center"
              >
                <FaSync className={`${isRefreshing ? 'animate-spin' : ''} text-xs sm:text-sm`} />
                <span className="hidden xs:inline">{isRefreshing ? 'Refreshing...' : 'Refresh'}</span>
              </motion.button>

              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => {
                  setShowForm(!showForm);
                  setIsMobileMenuOpen(false);
                }}
                className="flex items-center gap-2 px-3 sm:px-4 lg:px-6 py-2 sm:py-3 bg-gradient-to-r from-blue-500 to-purple-600 text-white rounded-lg lg:rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 text-sm sm:text-base flex-1 lg:flex-none justify-center"
              >
                <FaPlus />
                <span>New Transaction</span>
              </motion.button>
            </div>
          </div>

          {/* Date Range Filter */}
          <div className="flex flex-col sm:flex-row gap-3 mt-3">
            <input
              type="date"
              value={dateRange.start}
              onChange={(e) => setDateRange({...dateRange, start: e.target.value})}
              className="px-3 py-2 bg-white border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm flex-1"
              placeholder="Start Date"
            />
            <input
              type="date"
              value={dateRange.end}
              onChange={(e) => setDateRange({...dateRange, end: e.target.value})}
              className="px-3 py-2 bg-white border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm flex-1"
              placeholder="End Date"
            />
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

        {/* Add Transaction Form - Improved mobile layout */}
        <AnimatePresence>
          {showForm && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ type: "spring", damping: 25 }}
              className="bg-white/90 backdrop-blur-lg rounded-xl lg:rounded-2xl shadow-lg lg:shadow-2xl p-4 lg:p-6 mb-4 lg:mb-8 border border-white/20 overflow-hidden"
            >
              <motion.h3 
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                className="text-xl lg:text-2xl font-bold text-gray-800 mb-4 lg:mb-6 flex items-center gap-3"
              >
                <FaExchangeAlt className="text-blue-500" />
                Create New Transaction
              </motion.h3>

              <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 lg:gap-6">
                {/* Transaction Type */}
                <div className="relative">
                  <FaExchangeAlt className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                  <select
                    name="type"
                    value={form.type}
                    onChange={handleChange}
                    className="w-full pl-10 pr-4 py-3 bg-white border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-300 text-sm lg:text-base"
                  >
                    <option value="credit">Credit</option>
                    <option value="debit">Debit</option>
                  </select>
                </div>

                {/* Amount */}
                <div className="relative">
                  <FaMoneyBillWave className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                  <input
                    type="number"
                    name="amount"
                    value={form.amount}
                    onChange={handleChange}
                    placeholder="Amount"
                    className="w-full pl-10 pr-4 py-3 bg-white border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-300 text-sm lg:text-base"
                    required
                  />
                </div>

                {/* Type Of Money - Moved up and always visible */}
                <div className="relative">
                  <FaReceipt className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                  <input
                    type="text"
                    name="externalName"
                    value={form.externalName}
                    onChange={handleChange}
                    placeholder="Type Of Money"
                    className="w-full pl-10 pr-4 py-3 bg-white border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-300 text-sm lg:text-base"
                    required
                  />
                </div>

                {/* Date */}
                <div className="relative">
                  <FaCalendarAlt className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                  <input
                    type="date"
                    name="date"
                    value={form.date}
                    onChange={handleChange}
                    className="w-full pl-10 pr-4 py-3 bg-white border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-300 text-sm lg:text-base"
                    required
                  />
                </div>

                {/* Time */}
                <div className="relative">
                  <FaCalendarAlt className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                  <input
                    type="time"
                    name="time"
                    value={form.time}
                    onChange={handleChange}
                    className="w-full pl-10 pr-4 py-3 bg-white border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-300 text-sm lg:text-base"
                    required
                  />
                </div>

                {/* Sender Client */}
                <div className="relative">
                  <FaUser className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                  <select
                    name="senderClient"
                    value={form.senderClient}
                    onChange={handleChange}
                    className="w-full pl-10 pr-4 py-3 bg-white border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-300 text-sm lg:text-base"
                    disabled={form.type === "credit"}
                  >
                    <option value="">Select Sender</option>
                    {clients.map((c) => (
                      <option key={c._id} value={c._id}>{c.fullName}</option>
                    ))}
                  </select>
                </div>

                {/* Receiver Client */}
                <div className="relative">
                  <FaUser className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                  <select
                    name="receiverClient"
                    value={form.receiverClient}
                    onChange={handleChange}
                    className="w-full pl-10 pr-4 py-3 bg-white border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-300 text-sm lg:text-base"
                  >
                    <option value="">Select Receiver</option>
                    {clients.map((c) => (
                      <option key={c._id} value={c._id}>{c.fullName}</option>
                    ))}
                  </select>
                </div>

                {/* Tax Amount Display */}
                <div className="relative">
                  <FaMoneyBillWave className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                  <input
                    type="text"
                    value={`Tax: $${taxAmount.toFixed(2)}`}
                    readOnly
                    className="w-full pl-10 pr-4 py-3 bg-gray-100 border border-gray-200 rounded-lg text-gray-600 text-sm lg:text-base"
                  />
                </div>

                {/* Total Amount Display */}
                <div className="relative">
                  <FaMoneyBillWave className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                  <input
                    type="text"
                    value={`Total: $${totalAmount.toFixed(2)}`}
                    readOnly
                    className="w-full pl-10 pr-4 py-3 bg-gray-100 border border-gray-200 rounded-lg font-semibold text-blue-600 text-sm lg:text-base"
                  />
                </div>

                {/* Submit Button */}
                <motion.button
                  type="submit"
                  disabled={loading}
                  whileHover={{ scale: loading ? 1 : 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  className="col-span-1 md:col-span-2 lg:col-span-3 bg-gradient-to-r from-blue-500 to-purple-600 text-white py-3 rounded-lg lg:rounded-xl font-semibold text-sm lg:text-lg shadow-lg hover:shadow-xl transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {loading ? (
                    <div className="flex items-center justify-center gap-2">
                      <motion.div
                        animate={{ rotate: 360 }}
                        transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                        className="w-4 h-4 border-2 border-white border-t-transparent rounded-full"
                      />
                      Processing Transaction...
                    </div>
                  ) : (
                    "Create Transaction"
                  )}
                </motion.button>
              </form>

              {/* Transaction Preview */}
              {form.amount && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="mt-4 p-3 bg-blue-50 rounded-lg border border-blue-200"
                >
                  <p className="text-xs lg:text-sm text-blue-700 font-semibold">
                    💰 {form.type === "credit"
                      ? `After Tax: $${totalAmount.toFixed(2)} (Amount $${form.amount} - Tax $${taxAmount.toFixed(2)})`
                      : `Total with Tax: $${totalAmount.toFixed(2)} (Amount $${form.amount} + Tax $${taxAmount.toFixed(2)})`}
                  </p>
                </motion.div>
              )}
            </motion.div>
          )}
        </AnimatePresence>

        {/* Transactions List */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="bg-white/80 backdrop-blur-lg rounded-xl lg:rounded-2xl shadow-lg lg:shadow-xl overflow-hidden border border-white/20"
        >
          <div className="p-4 border-b border-gray-200">
            <div className="flex items-center justify-between">
              <h3 className="text-lg lg:text-2xl font-bold text-gray-800 flex items-center gap-2 lg:gap-3">
                <FaExchangeAlt className="text-blue-500" />
                <span className="hidden sm:inline">Transaction History</span>
                <span className="sm:hidden">Transactions</span>
                <span className="text-xs font-normal text-gray-500 bg-gray-100 px-2 py-1 rounded-full">
                  {filteredTransactions.length}
                </span>
              </h3>
              
              {selectedClient && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="text-xs text-gray-600 bg-blue-50 px-2 py-1 rounded-full hidden sm:block"
                >
                  Showing for: {clients.find(c => c._id === selectedClient)?.fullName}
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
                  className="w-6 h-6 border-3 border-blue-500 border-t-transparent rounded-full"
                />
              </div>
            ) : (
              <AnimatePresence>
                {currentTransactions.length > 0 ? (
                  <motion.div
                    variants={containerVariants}
                    initial="hidden"
                    animate="visible"
                  >
                    {currentTransactions.map((transaction, index) => (
                      <TransactionCard key={transaction._id} transaction={transaction} />
                    ))}
                  </motion.div>
                ) : (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="text-center py-8"
                  >
                    <div className="w-16 h-16 bg-gradient-to-r from-gray-200 to-gray-300 rounded-full flex items-center justify-center mx-auto mb-4">
                      <FaExchangeAlt className="text-2xl text-gray-400" />
                    </div>
                    <h4 className="text-lg font-semibold text-gray-500 mb-2">No Transactions Found</h4>
                    <p className="text-gray-400 mb-4 text-sm">Get started by creating your first transaction</p>
                    <motion.button
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={() => setShowForm(true)}
                      className="bg-gradient-to-r from-blue-500 to-purple-600 text-white px-4 py-2 rounded-lg shadow-lg hover:shadow-xl transition-all duration-300 text-sm"
                    >
                      <FaPlus className="inline mr-2" />
                      Create First Transaction
                    </motion.button>
                  </motion.div>
                )}
              </AnimatePresence>
            )}

            {/* Mobile Pagination */}
            {filteredTransactions.length > transactionsPerPage && (
              <motion.div 
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="flex flex-col items-center justify-between p-4 border-t border-gray-200 bg-gray-50 mt-4"
              >
                <div className="text-xs text-gray-700 mb-3">
                  Showing {indexOfFirstTransaction + 1} to {Math.min(indexOfLastTransaction, filteredTransactions.length)} of {filteredTransactions.length}
                </div>
                
                <div className="flex items-center space-x-1">
                  {/* Previous Button */}
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={prevPage}
                    disabled={currentPage === 1}
                    className="p-2 rounded-lg bg-white border border-gray-300 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50 transition-colors"
                  >
                    <FaChevronLeft className="w-3 h-3" />
                  </motion.button>

                  {/* Page Numbers */}
                  {getPageNumbers().map(number => (
                    <motion.button
                      key={number}
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={() => paginate(number)}
                      className={`px-2 py-1 rounded text-xs font-medium transition-colors ${
                        currentPage === number
                          ? 'bg-blue-500 text-white'
                          : 'bg-white text-gray-700 hover:bg-gray-50 border border-gray-300'
                      }`}
                    >
                      {number}
                    </motion.button>
                  ))}

                  {/* Next Button */}
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={nextPage}
                    disabled={currentPage === totalPages}
                    className="p-2 rounded-lg bg-white border border-gray-300 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50 transition-colors"
                  >
                    <FaChevronRight className="w-3 h-3" />
                  </motion.button>
                </div>
              </motion.div>
            )}
          </div>

          {/* Desktop View - Table */}
          <div className="hidden lg:block overflow-x-auto" ref={tableRef}>
            {loading ? (
              <div className="flex justify-center items-center py-12">
                <motion.div
                  animate={{ rotate: 360 }}
                  transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                  className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full"
                />
              </div>
            ) : (
              <>
                <table className="w-full min-w-[800px]">
                  <thead>
                    <tr className="bg-gradient-to-r from-gray-50 to-blue-50">
                      {["Receipt #", "Type", "Amount", "Tax", "Total", "Sender", "Receiver", "Type Of Money", "", "Date & Time", "Actions"].map((header) => (
                        <th key={header} className="px-4 sm:px-6 py-3 text-left text-xs sm:text-sm font-semibold text-gray-700 uppercase tracking-wider">
                          {header}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    <AnimatePresence>
                      {currentTransactions.map((transaction, index) => {
                        const totalDisplay = transaction.type === "credit"
                          ? (transaction.amount - transaction.taxAmount).toFixed(2)
                          : (transaction.amount + transaction.taxAmount).toFixed(2);

                        return (
                          <motion.tr
                            key={transaction._id}
                            initial={{ opacity: 0, x: -20 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: index * 0.03 }}
                            whileHover={{ backgroundColor: "rgba(59, 130, 246, 0.05)" }}
                            className="group transition-all duration-300"
                          >
                            <td className="px-4 sm:px-6 py-3 sm:py-4 whitespace-nowrap font-mono text-xs sm:text-sm text-gray-600">
                              #{transaction.receiptNumber}
                            </td>
                            <td className="px-4 sm:px-6 py-3 sm:py-4 whitespace-nowrap">
                              <span className={`inline-flex items-center px-2 sm:px-3 py-1 rounded-full text-xs sm:text-sm font-semibold ${
                                transaction.type === "credit" 
                                  ? "bg-green-100 text-green-800" 
                                  : "bg-red-100 text-red-800"
                              }`}>
                                {transaction.type === "credit" ? <FaArrowDown className="mr-1" /> : <FaArrowUp className="mr-1" />}
                                {transaction.type}
                              </span>
                            </td>
                            <td className="px-4 sm:px-6 py-3 sm:py-4 whitespace-nowrap font-semibold text-gray-700">
                              ${transaction.amount.toFixed(2)}
                            </td>
                            <td className="px-4 sm:px-6 py-3 sm:py-4 whitespace-nowrap text-gray-600">
                              ${transaction.taxAmount.toFixed(2)}
                            </td>
                            <td className="px-4 sm:px-6 py-3 sm:py-4 whitespace-nowrap font-bold text-blue-700">
                              ${totalDisplay}
                            </td>
                            <td className="px-4 sm:px-6 py-3 sm:py-4 whitespace-nowrap">
                              {transaction.senderClient ? (
                                <div className="flex items-center">
                                  <div className="w-6 h-6 sm:w-8 sm:h-8 bg-gradient-to-r from-red-500 to-orange-500 rounded-full flex items-center justify-center text-white text-xs font-bold mr-2">
                                    S
                                  </div>
                                  <span className="text-gray-700 text-xs sm:text-sm">{transaction.senderClient.fullName}</span>
                                </div>
                              ) : (
                                <span className="text-gray-400 italic text-xs sm:text-sm">-</span>
                              )}
                            </td>
                            <td className="px-4 sm:px-6 py-3 sm:py-4 whitespace-nowrap">
                              {transaction.receiverClient ? (
                                <div className="flex items-center">
                                  <div className="w-6 h-6 sm:w-8 sm:h-8 bg-gradient-to-r from-green-500 to-emerald-500 rounded-full flex items-center justify-center text-white text-xs font-bold mr-2">
                                    R
                                  </div>
                                  <span className="text-gray-700 text-xs sm:text-sm">{transaction.receiverClient.fullName}</span>
                                </div>
                              ) : (
                                <span className="text-gray-400 italic text-xs sm:text-sm">-</span>
                              )}
                            </td>
                            <td className="px-4 sm:px-6 py-3 sm:py-4 whitespace-nowrap text-gray-600 text-xs sm:text-sm">
                              {transaction.externalName || "-"}
                            </td>
                            <td className="px-4 sm:px-6 py-3 sm:py-4 text-gray-600 max-w-xs truncate text-xs sm:text-sm">
                              {transaction.notes || "-"}
                            </td>
                            <td className="px-4 sm:px-6 py-3 sm:py-4 whitespace-nowrap text-xs sm:text-sm text-gray-500">
                              <div className="flex flex-col">
                                <div className="flex items-center">
                                  <FaCalendarAlt className="mr-1 sm:mr-2 text-gray-400" />
                                  {new Date(transaction.date).toLocaleDateString()}
                                </div>
                                <div className="text-xs text-gray-400 mt-1">
                                  {new Date(transaction.date).toLocaleTimeString()}
                                </div>
                              </div>
                            </td>
                            <td className="px-4 sm:px-6 py-3 sm:py-4 whitespace-nowrap">
                              <motion.button
                                whileHover={{ scale: 1.05 }}
                                whileTap={{ scale: 0.95 }}
                                className="flex items-center gap-1 px-3 py-1 bg-blue-500 text-white rounded-lg text-xs shadow-md hover:shadow-lg transition-all duration-200"
                              >
                                <FaEye size={10} />
                                View
                              </motion.button>
                            </td>
                          </motion.tr>
                        );
                      })}
                    </AnimatePresence>
                  </tbody>
                </table>

                {/* Desktop Pagination */}
                {filteredTransactions.length > transactionsPerPage && (
                  <motion.div 
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="flex flex-col sm:flex-row items-center justify-between p-4 border-t border-gray-200 bg-gray-50"
                  >
                    <div className="text-sm text-gray-700 mb-4 sm:mb-0">
                      Showing {indexOfFirstTransaction + 1} to {Math.min(indexOfLastTransaction, filteredTransactions.length)} of {filteredTransactions.length} entries
                    </div>
                    
                    <div className="flex items-center space-x-1">
                      {/* Previous Button */}
                      <motion.button
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={prevPage}
                        disabled={currentPage === 1}
                        className="p-2 rounded-lg bg-white border border-gray-300 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50 transition-colors"
                      >
                        <FaChevronLeft className="w-4 h-4" />
                      </motion.button>

                      {/* Page Numbers */}
                      {getPageNumbers().map(number => (
                        <motion.button
                          key={number}
                          whileHover={{ scale: 1.05 }}
                          whileTap={{ scale: 0.95 }}
                          onClick={() => paginate(number)}
                          className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                            currentPage === number
                              ? 'bg-blue-500 text-white'
                              : 'bg-white text-gray-700 hover:bg-gray-50 border border-gray-300'
                          }`}
                        >
                          {number}
                        </motion.button>
                      ))}

                      {/* Next Button */}
                      <motion.button
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={nextPage}
                        disabled={currentPage === totalPages}
                        className="p-2 rounded-lg bg-white border border-gray-300 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50 transition-colors"
                      >
                        <FaChevronRight className="w-4 h-4" />
                      </motion.button>
                    </div>
                  </motion.div>
                )}
              </>
            )}

            {filteredTransactions.length === 0 && !loading && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="text-center py-12"
              >
                <div className="w-24 h-24 bg-gradient-to-r from-gray-200 to-gray-300 rounded-full flex items-center justify-center mx-auto mb-4">
                  <FaExchangeAlt className="text-3xl text-gray-400" />
                </div>
                <h4 className="text-xl font-semibold text-gray-500 mb-2">No Transactions Found</h4>
                <p className="text-gray-400 mb-4">Get started by creating your first transaction</p>
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => setShowForm(true)}
                  className="bg-gradient-to-r from-blue-500 to-purple-600 text-white px-6 py-3 rounded-xl shadow-lg hover:shadow-xl transition-all duration-300"
                >
                  <FaPlus className="inline mr-2" />
                  Create First Transaction
                </motion.button>
              </motion.div>
            )}
          </div>
        </motion.div>
      </motion.div>

      {/* Background Decorations */}
      <div className="fixed inset-0 -z-10 overflow-hidden">
        <div className="absolute -top-40 -right-40 w-60 h-60 lg:w-80 lg:h-80 bg-blue-200 rounded-full blur-3xl opacity-30 animate-pulse"></div>
        <div className="absolute -bottom-40 -left-40 w-60 h-60 lg:w-80 lg:h-80 bg-purple-200 rounded-full blur-3xl opacity-30 animate-pulse delay-1000"></div>
      </div>
    </div>
  );
};

export default Transaction;