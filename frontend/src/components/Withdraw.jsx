import React, { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  FaMoneyBillWave, 
  FaSearch, 
  FaFilePdf, 
  FaFileExcel, 
  FaPrint,
  FaFilter,
  FaUser,
  FaReceipt,
  FaCalendarAlt,
  FaPlus,
  FaSync,
  FaDownload,
  FaArrowDown,
  FaEye,
  FaChartLine,
  FaChevronLeft,
  FaChevronRight,
  FaTimes,
  FaPercent,
  FaEllipsisH,
  FaChevronDown,
  FaCheckCircle
} from "react-icons/fa";
import { jsPDF } from "jspdf";
import * as XLSX from "xlsx";

const Withdraw = () => {
  const [clients, setClients] = useState([]);
  const [withdraws, setWithdraws] = useState([]);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [form, setForm] = useState({ 
    clientId: "", 
    amount: "", 
    notes: "",
    date: "",
    time: ""
  });
  const [taxRate, setTaxRate] = useState(0);
  const [taxAmount, setTaxAmount] = useState(0);
  const [clientReceives, setClientReceives] = useState(0);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedClient, setSelectedClient] = useState("");
  const [dateRange, setDateRange] = useState({ start: "", end: "" });
  const [showForm, setShowForm] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [expandedWithdraw, setExpandedWithdraw] = useState(null);

  // ✅ Load clients
  useEffect(() => {
    const fetchClients = async () => {
      try {
        const token = localStorage.getItem("token");
        const res = await fetch("http://localhost:5001/api/clients", {
          headers: { Authorization: `Bearer ${token}` },
        });
        const data = await res.json();
        setClients(data);
      } catch (err) {
        setMessage("❌ Failed to load clients");
      }
    };
    fetchClients();
  }, []);

  // ✅ Load tax rate
  useEffect(() => {
    const fetchTaxRate = async () => {
      try {
        const token = localStorage.getItem("token");
        const res = await fetch("http://localhost:5001/api/settings/taxRate", {
          headers: { Authorization: `Bearer ${token}` },
        });
        const data = await res.json();
        setTaxRate(parseFloat(data?.value) || 0);
      } catch (err) {
        console.error("Failed to load tax rate:", err);
        setTaxRate(0);
      }
    };
    fetchTaxRate();
  }, []);

  // ✅ Recalculate tax when amount changes
  useEffect(() => {
    const amount = parseFloat(form.amount) || 0;
    const tax = amount * taxRate;
    setTaxAmount(tax);
    setClientReceives(amount - tax);
  }, [form.amount, taxRate]);

  // ✅ Load withdraws
  const loadWithdraws = async () => {
    setIsRefreshing(true);
    try {
      const token = localStorage.getItem("token");
      const res = await fetch("http://localhost:5001/api/withdraw", {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      setWithdraws(data);
    } catch (err) {
      setMessage("❌ Failed to load withdraw history");
    } finally {
      setIsRefreshing(false);
    }
  };

  useEffect(() => {
    loadWithdraws();
    
    const now = new Date();
    const currentDate = now.toISOString().split('T')[0];
    const currentTime = now.toTimeString().slice(0, 5);
    
    setForm(prev => ({
      ...prev,
      date: currentDate,
      time: currentTime
    }));
  }, []);

  // ✅ Submit withdraw
  const handleSubmit = async (e) => {
    e.preventDefault();
    setMessage("");
    setLoading(true);

    try {
      const token = localStorage.getItem("token");
      const withdrawDateTime = `${form.date}T${form.time}:00`;
      
      const withdrawData = {
        clientId: form.clientId,
        amount: parseFloat(form.amount),
        notes: form.notes,
        date: withdrawDateTime
      };

      const res = await fetch("http://localhost:5001/api/withdraw", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(withdrawData),
      });

      const data = await res.json();
      if (res.ok) {
        setMessage("✅ Withdraw successful with tax deducted!");
        setForm({ 
          clientId: "", 
          amount: "", 
          notes: "",
          date: new Date().toISOString().split('T')[0],
          time: new Date().toTimeString().slice(0, 5)
        });
        setShowForm(false);
        loadWithdraws();
      } else {
        setMessage(`❌ ${data.message}`);
      }
    } catch (err) {
      setMessage("❌ Failed to process withdraw");
    } finally {
      setLoading(false);
    }
  };

  // Filter withdraws
  const filteredWithdraws = withdraws.filter(withdraw => {
    const matchesSearch = 
      withdraw.notes?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      withdraw.client?.fullName?.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesClient = !selectedClient || 
      withdraw.client?._id === selectedClient;

    const withdrawDate = new Date(withdraw.createdAt || withdraw.date);
    const matchesDateRange = 
      (!dateRange.start || withdrawDate >= new Date(dateRange.start)) &&
      (!dateRange.end || withdrawDate <= new Date(dateRange.end + "T23:59:59"));

    return matchesSearch && matchesClient && matchesDateRange;
  });

  // Calculate withdraw statistics
  const withdrawStats = filteredWithdraws.reduce((acc, withdraw) => {
    acc.totalAmount += withdraw.amount;
    acc.totalTax += withdraw.taxAmount || 0;
    acc.totalReceived += withdraw.totalReceived || (withdraw.amount - (withdraw.taxAmount || 0));
    return acc;
  }, { totalAmount: 0, totalTax: 0, totalReceived: 0 });

  // Mobile Withdraw Card Component
  const WithdrawCard = ({ withdraw }) => {
    const isExpanded = expandedWithdraw === withdraw._id;
    
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white rounded-xl shadow-lg border border-gray-100 mb-4 overflow-hidden"
      >
        <div 
          className="p-4 cursor-pointer"
          onClick={() => setExpandedWithdraw(isExpanded ? null : withdraw._id)}
        >
          {/* Header */}
          <div className="flex justify-between items-start mb-3">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white font-bold">
                {withdraw.client?.fullName?.charAt(0) || "U"}
              </div>
              <div>
                <p className="font-semibold text-gray-800 text-sm">
                  {withdraw.client?.fullName || "Unknown"}
                </p>
                <p className="text-xs text-gray-500">
                  ${withdraw.amount?.toFixed(2)}
                </p>
              </div>
            </div>
            <div className="flex items-center space-x-2">
              <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-semibold bg-green-100 text-green-800">
                {withdraw.status || "completed"}
              </span>
              <div className="text-gray-400">
                {isExpanded ? <FaChevronUp size={12} /> : <FaChevronDown size={12} />}
              </div>
            </div>
          </div>

          {/* Basic Info */}
          <div className="grid grid-cols-2 gap-2 text-xs text-gray-600">
            <div className="flex items-center">
              <FaMoneyBillWave className="mr-1 text-green-500" />
              <span className="font-semibold">
                ${(withdraw.totalReceived || (withdraw.amount - (withdraw.taxAmount || 0))).toFixed(2)}
              </span>
            </div>
            <div className="flex items-center">
              <FaCalendarAlt className="mr-1 text-gray-400" />
              <span>{new Date(withdraw.createdAt || withdraw.date).toLocaleDateString()}</span>
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
              className="px-4 pb-4 border-t border-gray-100"
            >
              <div className="grid grid-cols-2 gap-3 mt-3 text-xs">
                <div>
                  <p className="font-semibold text-gray-500">Tax Rate</p>
                  <p className="text-gray-800">{((withdraw.taxRate || 0) * 100).toFixed(1)}%</p>
                </div>
                <div>
                  <p className="font-semibold text-gray-500">Tax Amount</p>
                  <p className="text-red-600 font-semibold">${(withdraw.taxAmount || 0).toFixed(2)}</p>
                </div>
                <div>
                  <p className="font-semibold text-gray-500">Time</p>
                  <p className="text-gray-800">{new Date(withdraw.createdAt || withdraw.date).toLocaleTimeString()}</p>
                </div>
                <div>
                  <p className="font-semibold text-gray-500">Status</p>
                  <p className="text-green-600 font-semibold">{withdraw.status || "completed"}</p>
                </div>
              </div>
              
              {withdraw.notes && (
                <div className="mt-3">
                  <p className="font-semibold text-gray-500 text-xs mb-1">Notes</p>
                  <p className="text-gray-800 text-sm bg-gray-50 p-2 rounded-lg">{withdraw.notes}</p>
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    );
  };

  // Export functions
  const exportToPDF = () => {
    const doc = new jsPDF();
    doc.text("Withdraw Report", 20, 20);
    doc.text(`Generated on: ${new Date().toLocaleDateString()}`, 20, 30);
    doc.text(`Total Records: ${filteredWithdraws.length}`, 20, 40);
    
    let yPosition = 60;
    filteredWithdraws.forEach((withdraw, index) => {
      if (yPosition > 270) {
        doc.addPage();
        yPosition = 20;
      }
      doc.text(`${index + 1}. Client: ${withdraw.client?.fullName || "Unknown"}`, 20, yPosition);
      doc.text(`   Amount: $${withdraw.amount} | Tax: $${(withdraw.taxAmount || 0).toFixed(2)}`, 20, yPosition + 7);
      doc.text(`   Received: $${(withdraw.totalReceived || (withdraw.amount - (withdraw.taxAmount || 0))).toFixed(2)}`, 20, yPosition + 14);
      yPosition += 25;
    });
    doc.save(`withdraws-report-${new Date().toISOString().split('T')[0]}.pdf`);
  };

  const exportToExcel = () => {
    const worksheet = XLSX.utils.json_to_sheet(
      filteredWithdraws.map(w => ({
        'Client': w.client?.fullName || 'Unknown',
        'Amount': w.amount,
        'Tax Rate': `${(w.taxRate || 0) * 100}%`,
        'Tax Amount': w.taxAmount || 0,
        'Client Receives': w.totalReceived || (w.amount - (w.taxAmount || 0)),
        'Notes': w.notes || '-',
        'Date': new Date(w.createdAt || w.date).toLocaleDateString(),
        'Status': w.status || 'completed'
      }))
    );
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Withdraws");
    XLSX.writeFile(workbook, `withdraws-${new Date().toISOString().split('T')[0]}.xlsx`);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 p-3 sm:p-4 lg:p-6">
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="max-w-7xl mx-auto"
      >
        {/* Header Section - Responsive */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-4 sm:mb-6 lg:mb-8"
        >
          <h1 className="text-xl sm:text-2xl lg:text-4xl xl:text-5xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent mb-2 sm:mb-3 lg:mb-4">
            💸 Withdraw Management
          </h1>
          <p className="text-sm sm:text-base lg:text-xl text-gray-600 max-w-2xl mx-auto px-2">
            Process client withdrawals with automatic tax calculation
          </p>
        </motion.div>

        {/* Stats Cards - Responsive Grid */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="grid grid-cols-1 xs:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4 lg:gap-6 mb-4 sm:mb-6 lg:mb-8"
        >
          {[
            { 
              icon: <FaMoneyBillWave className="text-green-500" />, 
              label: "Total Withdrawn", 
              value: `$${withdrawStats.totalAmount.toFixed(2)}`, 
              color: "from-green-500 to-emerald-500" 
            },
            { 
              icon: <FaPercent className="text-red-500" />, 
              label: "Total Tax", 
              value: `$${withdrawStats.totalTax.toFixed(2)}`, 
              color: "from-red-500 to-orange-500" 
            },
            { 
              icon: <FaDownload className="text-blue-500" />, 
              label: "Clients Received", 
              value: `$${withdrawStats.totalReceived.toFixed(2)}`, 
              color: "from-blue-500 to-cyan-500" 
            }
          ].map((stat, index) => (
            <motion.div
              key={stat.label}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: index * 0.1 }}
              whileHover={{ scale: 1.02, y: -2 }}
              className={`bg-gradient-to-br ${stat.color} text-white p-4 sm:p-5 lg:p-6 rounded-xl sm:rounded-2xl shadow-lg relative overflow-hidden group`}
            >
              <div className="absolute -right-6 -top-6 w-16 h-16 sm:w-20 sm:h-20 bg-white/10 rounded-full group-hover:scale-150 transition-transform duration-500"></div>
              <div className="relative z-10">
                <div className="text-xl sm:text-2xl lg:text-3xl mb-2 sm:mb-3 transform group-hover:scale-110 transition-transform duration-300">
                  {stat.icon}
                </div>
                <p className="text-lg sm:text-xl lg:text-2xl font-bold mb-1">{stat.value}</p>
                <p className="text-blue-100 text-xs sm:text-sm">{stat.label}</p>
              </div>
            </motion.div>
          ))}
        </motion.div>

        {/* Control Panel - Responsive Layout */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="bg-white/80 backdrop-blur-lg rounded-xl sm:rounded-2xl shadow-lg sm:shadow-xl p-4 sm:p-6 mb-4 sm:mb-6 lg:mb-8 border border-white/20"
        >
          {/* Search and Filters - Stack on mobile */}
          <div className="flex flex-col lg:flex-row gap-3 sm:gap-4 items-stretch lg:items-center justify-between mb-4">
            <div className="flex flex-col sm:flex-row gap-3 flex-1">
              <div className="relative flex-1">
                <FaSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 text-sm sm:text-base" />
                <input
                  type="text"
                  placeholder="Search withdraws..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-9 sm:pl-10 pr-4 py-2 sm:py-3 bg-white border border-gray-200 rounded-lg sm:rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-300 text-sm sm:text-base"
                />
              </div>

              <select
                value={selectedClient}
                onChange={(e) => setSelectedClient(e.target.value)}
                className="px-3 sm:px-4 py-2 sm:py-3 bg-white border border-gray-200 rounded-lg sm:rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm sm:text-base"
              >
                <option value="">All Clients</option>
                {clients.map(client => (
                  <option key={client._id} value={client._id}>
                    {client.fullName}
                  </option>
                ))}
              </select>
            </div>

            {/* Action Buttons - Wrap on small screens */}
            <div className="flex gap-2 sm:gap-3 flex-wrap sm:flex-nowrap">
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={loadWithdraws}
                disabled={isRefreshing}
                className="flex items-center gap-2 px-3 sm:px-4 lg:px-6 py-2 sm:py-3 bg-gradient-to-r from-gray-600 to-gray-700 text-white rounded-lg sm:rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 disabled:opacity-50 text-sm sm:text-base flex-1 sm:flex-none justify-center"
              >
                <FaSync className={`${isRefreshing ? 'animate-spin' : ''} text-xs sm:text-sm`} />
                <span className="hidden xs:inline">{isRefreshing ? 'Refreshing...' : 'Refresh'}</span>
              </motion.button>

              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => setShowForm(!showForm)}
                className="flex items-center gap-2 px-3 sm:px-4 lg:px-6 py-2 sm:py-3 bg-gradient-to-r from-blue-500 to-purple-600 text-white rounded-lg sm:rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 text-sm sm:text-base flex-1 sm:flex-none justify-center"
              >
                <FaPlus className="text-xs sm:text-sm" />
                <span>New Withdraw</span>
              </motion.button>
            </div>
          </div>

          {/* Date Range Filter - Stack on mobile */}
          <div className="flex flex-col sm:flex-row gap-3 mb-4">
            <input
              type="date"
              value={dateRange.start}
              onChange={(e) => setDateRange({...dateRange, start: e.target.value})}
              className="flex-1 px-3 sm:px-4 py-2 sm:py-3 bg-white border border-gray-200 rounded-lg sm:rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm sm:text-base"
              placeholder="Start Date"
            />
            <input
              type="date"
              value={dateRange.end}
              onChange={(e) => setDateRange({...dateRange, end: e.target.value})}
              className="flex-1 px-3 sm:px-4 py-2 sm:py-3 bg-white border border-gray-200 rounded-lg sm:rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm sm:text-base"
              placeholder="End Date"
            />
          </div>

          {/* Export Buttons - Wrap on small screens */}
          <div className="flex gap-2 flex-wrap">
            {[
              { icon: FaFilePdf, label: "PDF", onClick: exportToPDF, color: "bg-red-500 hover:bg-red-600" },
              { icon: FaFileExcel, label: "Excel", onClick: exportToExcel, color: "bg-green-500 hover:bg-green-600" },
              { icon: FaPrint, label: "Print", onClick: () => window.print(), color: "bg-blue-500 hover:bg-blue-600" }
            ].map((button, index) => (
              <motion.button
                key={button.label}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={button.onClick}
                className={`flex items-center gap-2 px-3 py-2 text-white rounded-lg transition-all duration-300 shadow-lg text-sm flex-1 sm:flex-none justify-center ${button.color}`}
              >
                <button.icon size={14} />
                <span className="hidden xs:inline">{button.label}</span>
              </motion.button>
            ))}
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

        {/* Add Withdraw Form - Responsive Grid */}
        <AnimatePresence>
          {showForm && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ type: "spring", damping: 25 }}
              className="bg-white/90 backdrop-blur-lg rounded-xl sm:rounded-2xl shadow-lg sm:shadow-2xl p-4 sm:p-6 mb-4 sm:mb-6 lg:mb-8 border border-white/20 overflow-hidden"
            >
              <motion.h3 
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                className="text-lg sm:text-xl lg:text-2xl font-bold text-gray-800 mb-4 sm:mb-6 flex items-center gap-2 sm:gap-3"
              >
                <FaMoneyBillWave className="text-blue-500 text-sm sm:text-base" />
                Create New Withdraw
              </motion.h3>

              <form onSubmit={handleSubmit} className="grid grid-cols-1 xs:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4 lg:gap-6">
                {/* Form fields with responsive sizing */}
                {[
                  {
                    type: "select",
                    name: "clientId",
                    icon: FaUser,
                    placeholder: "Select Client",
                    options: clients.map(c => ({ value: c._id, label: `${c.fullName} (Balance: $${c.balance?.toFixed(2) || 0})` }))
                  },
                  {
                    type: "number",
                    name: "amount",
                    icon: FaMoneyBillWave,
                    placeholder: "Amount",
                    step: "0.01"
                  },
                  {
                    type: "date",
                    name: "date",
                    icon: FaCalendarAlt
                  },
                  {
                    type: "time",
                    name: "time",
                    icon: FaCalendarAlt
                  },
                  {
                    type: "text",
                    name: "notes",
                    icon: FaReceipt,
                    placeholder: "Notes (optional)",
                    span: "xs:col-span-2"
                  }
                ].map((field, index) => (
                  <div key={field.name} className={`relative ${field.span || ''}`}>
                    <field.icon className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 text-sm sm:text-base" />
                    {field.type === "select" ? (
                      <select
                        value={form[field.name]}
                        onChange={(e) => setForm({ ...form, [field.name]: e.target.value })}
                        className="w-full pl-9 sm:pl-10 pr-4 py-2 sm:py-3 bg-white border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-300 text-sm sm:text-base"
                        required={field.required}
                      >
                        <option value="">{field.placeholder}</option>
                        {field.options?.map(opt => (
                          <option key={opt.value} value={opt.value}>{opt.label}</option>
                        ))}
                      </select>
                    ) : (
                      <input
                        type={field.type}
                        step={field.step}
                        value={form[field.name]}
                        onChange={(e) => setForm({ ...form, [field.name]: e.target.value })}
                        placeholder={field.placeholder}
                        className="w-full pl-9 sm:pl-10 pr-4 py-2 sm:py-3 bg-white border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-300 text-sm sm:text-base"
                        required={field.required}
                      />
                    )}
                  </div>
                ))}

                {/* Tax Information Display */}
                {[
                  { icon: FaPercent, value: `Tax Rate: ${(taxRate * 100).toFixed(1)}%`, bg: "bg-gray-100" },
                  { icon: FaMoneyBillWave, value: `Tax Amount: $${taxAmount.toFixed(2)}`, bg: "bg-gray-100" },
                  { icon: FaDownload, value: `Client Receives: $${clientReceives.toFixed(2)}`, bg: "bg-green-50 border border-green-200 text-green-700 font-semibold" }
                ].map((display, index) => (
                  <div key={index} className="relative">
                    <display.icon className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 text-sm sm:text-base" />
                    <input
                      type="text"
                      value={display.value}
                      readOnly
                      className={`w-full pl-9 sm:pl-10 pr-4 py-2 sm:py-3 rounded-lg text-sm sm:text-base ${display.bg}`}
                    />
                  </div>
                ))}

                {/* Submit Button */}
                <motion.button
                  type="submit"
                  disabled={loading}
                  whileHover={{ scale: loading ? 1 : 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  className="col-span-1 xs:col-span-2 lg:col-span-3 bg-gradient-to-r from-blue-500 to-purple-600 text-white py-3 sm:py-4 rounded-lg sm:rounded-xl font-semibold text-sm sm:text-base lg:text-lg shadow-lg hover:shadow-xl transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  {loading ? (
                    <>
                      <motion.div
                        animate={{ rotate: 360 }}
                        transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                        className="w-4 h-4 sm:w-5 sm:h-5 border-2 border-white border-t-transparent rounded-full"
                      />
                      <span className="text-xs sm:text-sm">Processing Withdraw...</span>
                    </>
                  ) : (
                    <>
                      <FaCheckCircle className="text-sm sm:text-base" />
                      Process Withdraw
                    </>
                  )}
                </motion.button>
              </form>

              {/* Withdraw Preview */}
              {form.amount && form.clientId && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="mt-3 sm:mt-4 p-3 bg-blue-50 rounded-lg border border-blue-200"
                >
                  <p className="text-xs sm:text-sm text-blue-700 font-semibold">
                    💰 Withdraw Summary: Client will receive ${clientReceives.toFixed(2)} after ${taxAmount.toFixed(2)} tax deduction
                    {form.clientId && (
                      <span className="block text-xs text-blue-600 mt-1">
                        Selected client: {clients.find(c => c._id === form.clientId)?.fullName}
                      </span>
                    )}
                  </p>
                </motion.div>
              )}
            </motion.div>
          )}
        </AnimatePresence>

        {/* Withdraw History - Mobile Cards & Desktop Table */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="bg-white/80 backdrop-blur-lg rounded-xl sm:rounded-2xl shadow-lg sm:shadow-xl overflow-hidden border border-white/20"
        >
          <div className="p-4 sm:p-6 border-b border-gray-200">
            <h3 className="text-lg sm:text-xl lg:text-2xl font-bold text-gray-800 flex items-center gap-2 sm:gap-3">
              <FaMoneyBillWave className="text-blue-500 text-sm sm:text-base" />
              Withdraw History
              <span className="text-xs sm:text-sm font-normal text-gray-500 bg-gray-100 px-2 sm:px-3 py-1 rounded-full">
                {filteredWithdraws.length} records
              </span>
            </h3>
          </div>

          {/* Mobile View - Cards */}
          <div className="block lg:hidden p-3 sm:p-4">
            {filteredWithdraws.length > 0 ? (
              <div className="space-y-3">
                {filteredWithdraws.map((withdraw) => (
                  <WithdrawCard key={withdraw._id} withdraw={withdraw} />
                ))}
              </div>
            ) : (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="text-center py-8"
              >
                <div className="w-16 h-16 sm:w-20 sm:h-20 bg-gradient-to-r from-gray-200 to-gray-300 rounded-full flex items-center justify-center mx-auto mb-3 sm:mb-4">
                  <FaMoneyBillWave className="text-xl sm:text-2xl text-gray-400" />
                </div>
                <h4 className="text-base sm:text-lg font-semibold text-gray-500 mb-2">No Withdraws Found</h4>
                <p className="text-gray-400 text-sm sm:text-base mb-3 sm:mb-4">Get started by processing your first withdraw</p>
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => setShowForm(true)}
                  className="bg-gradient-to-r from-blue-500 to-purple-600 text-white px-4 sm:px-6 py-2 sm:py-3 rounded-lg shadow-lg hover:shadow-xl transition-all duration-300 text-sm sm:text-base"
                >
                  <FaPlus className="inline mr-2 text-xs sm:text-sm" />
                  Process First Withdraw
                </motion.button>
              </motion.div>
            )}
          </div>

          {/* Desktop View - Table */}
          <div className="hidden lg:block overflow-x-auto">
            <table className="w-full min-w-[800px]">
              <thead>
                <tr className="bg-gradient-to-r from-gray-50 to-blue-50">
                  {["Client", "Amount", "Tax Rate", "Tax Amount", "Client Receives", "Date & Time", "Status", "Notes"].map((header) => (
                    <th key={header} className="px-4 sm:px-6 py-3 sm:py-4 text-left text-xs sm:text-sm font-semibold text-gray-700 uppercase tracking-wider">
                      {header}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                <AnimatePresence>
                  {filteredWithdraws.map((withdraw, index) => (
                    <motion.tr
                      key={withdraw._id}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: index * 0.03 }}
                      whileHover={{ backgroundColor: "rgba(59, 130, 246, 0.05)" }}
                      className="group transition-all duration-300"
                    >
                      <td className="px-4 sm:px-6 py-3 sm:py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <div className="w-8 h-8 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white font-bold mr-3">
                            {withdraw.client?.fullName?.charAt(0) || "U"}
                          </div>
                          <span className="text-gray-700 font-medium text-sm sm:text-base">{withdraw.client?.fullName || "Unknown"}</span>
                        </div>
                      </td>
                      <td className="px-4 sm:px-6 py-3 sm:py-4 whitespace-nowrap font-semibold text-gray-700 text-sm sm:text-base">
                        ${withdraw.amount?.toFixed(2)}
                      </td>
                      <td className="px-4 sm:px-6 py-3 sm:py-4 whitespace-nowrap text-gray-600 text-sm sm:text-base">
                        {((withdraw.taxRate || 0) * 100).toFixed(1)}%
                      </td>
                      <td className="px-4 sm:px-6 py-3 sm:py-4 whitespace-nowrap text-red-600 font-semibold text-sm sm:text-base">
                        ${(withdraw.taxAmount || 0).toFixed(2)}
                      </td>
                      <td className="px-4 sm:px-6 py-3 sm:py-4 whitespace-nowrap font-bold text-green-700 text-sm sm:text-base">
                        ${(withdraw.totalReceived || (withdraw.amount - (withdraw.taxAmount || 0))).toFixed(2)}
                      </td>
                      <td className="px-4 sm:px-6 py-3 sm:py-4 whitespace-nowrap text-xs sm:text-sm text-gray-500">
                        <div className="flex flex-col">
                          <div className="flex items-center">
                            <FaCalendarAlt className="mr-1 sm:mr-2 text-gray-400" />
                            {new Date(withdraw.createdAt || withdraw.date).toLocaleDateString()}
                          </div>
                          <div className="text-xs text-gray-400 mt-1">
                            {new Date(withdraw.createdAt || withdraw.date).toLocaleTimeString()}
                          </div>
                        </div>
                      </td>
                      <td className="px-4 sm:px-6 py-3 sm:py-4 whitespace-nowrap">
                        <span className={`inline-flex items-center px-2 sm:px-3 py-1 rounded-full text-xs font-semibold ${
                          (withdraw.status || "completed") === "completed" 
                            ? "bg-green-100 text-green-800" 
                            : "bg-yellow-100 text-yellow-800"
                        }`}>
                          {withdraw.status || "completed"}
                        </span>
                      </td>
                      <td className="px-4 sm:px-6 py-3 sm:py-4 text-gray-600 max-w-xs truncate text-sm sm:text-base">
                        {withdraw.notes || "-"}
                      </td>
                    </motion.tr>
                  ))}
                </AnimatePresence>
              </tbody>
            </table>

            {filteredWithdraws.length === 0 && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="text-center py-12"
              >
                <div className="w-20 h-20 bg-gradient-to-r from-gray-200 to-gray-300 rounded-full flex items-center justify-center mx-auto mb-4">
                  <FaMoneyBillWave className="text-2xl text-gray-400" />
                </div>
                <h4 className="text-lg font-semibold text-gray-500 mb-2">No Withdraws Found</h4>
                <p className="text-gray-400 mb-4">Get started by processing your first withdraw</p>
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => setShowForm(true)}
                  className="bg-gradient-to-r from-blue-500 to-purple-600 text-white px-6 py-3 rounded-xl shadow-lg hover:shadow-xl transition-all duration-300"
                >
                  <FaPlus className="inline mr-2" />
                  Process First Withdraw
                </motion.button>
              </motion.div>
            )}
          </div>
        </motion.div>
      </motion.div>

      {/* Background Decorations */}
      <div className="fixed inset-0 -z-10 overflow-hidden">
        <div className="absolute -top-20 -right-20 w-40 h-40 sm:w-60 sm:h-60 lg:w-80 lg:h-80 bg-blue-200 rounded-full blur-3xl opacity-30 animate-pulse"></div>
        <div className="absolute -bottom-20 -left-20 w-40 h-40 sm:w-60 sm:h-60 lg:w-80 lg:h-80 bg-purple-200 rounded-full blur-3xl opacity-30 animate-pulse delay-1000"></div>
      </div>
    </div>
  );
};

// Add missing FaChevronUp icon
const FaChevronUp = ({ size = 16 }) => (
  <svg stroke="currentColor" fill="currentColor" strokeWidth="0" viewBox="0 0 320 512" height={size} width={size}>
    <path d="M177 159.7l136 136c9.4 9.4 9.4 24.6 0 33.9l-22.6 22.6c-9.4 9.4-24.6 9.4-33.9 0L160 255.9l-96.4 96.4c-9.4 9.4-24.6 9.4-33.9 0L7 329.7c-9.4-9.4-9.4-24.6 0-33.9l136-136c9.4-9.5 24.6-9.5 34-.1z"></path>
  </svg>
);

export default Withdraw;