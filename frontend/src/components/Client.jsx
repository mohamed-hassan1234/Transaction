import React, { useState, useEffect } from "react";
import axios from "axios";
import { motion, AnimatePresence } from "framer-motion";
import { 
  FaUserPlus, 
  FaSearch, 
  FaUserTie, 
  FaPhone, 
  FaMapMarkerAlt, 
  FaIdCard,
  FaGraduationCap,
  FaUserCheck,
  FaDollarSign,
  FaPlus,
  FaSync,
  FaFilter,
  FaEye,
  FaEdit,
  FaTrash,
  FaBars,
  FaTimes,
  FaChevronDown,
  FaChevronUp
} from "react-icons/fa";

const Client = () => {
  const [clients, setClients] = useState([]);
  const [guarantors, setGuarantors] = useState([]);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [expandedClient, setExpandedClient] = useState(null);
  const [form, setForm] = useState({
    fullName: "",
    phone: "",
    address: "",
    nationalId: "",
    educationLevel: "",
    guarantor: ""
  });

  const token = localStorage.getItem("token");

  // Fetch clients
  const fetchClients = async () => {
    setLoading(true);
    setIsRefreshing(true);
    try {
      const res = await axios.get("http://localhost:5001/api/clients", {
        headers: { Authorization: `Bearer ${token}` },
      });
      setClients(res.data);
    } catch (err) {
      setMessage(err.response?.data?.message || "Failed to fetch clients");
    } finally {
      setLoading(false);
      setIsRefreshing(false);
    }
  };

  // Fetch guarantors
  const fetchGuarantors = async () => {
    try {
      const res = await axios.get("http://localhost:5001/api/guarantors", {
        headers: { Authorization: `Bearer ${token}` },
      });
      setGuarantors(res.data);
    } catch (err) {
      console.error("Failed to fetch guarantors", err);
    }
  };

  useEffect(() => {
    fetchClients();
    fetchGuarantors();
  }, []);

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMessage("");
    setLoading(true);
    
    try {
      await axios.post(
        "http://localhost:5001/api/clients",
        form,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setMessage("✅ Client created successfully!");
      setForm({
        fullName: "",
        phone: "",
        address: "",
        nationalId: "",
        educationLevel: "",
        guarantor: ""
      });
      setShowForm(false);
      fetchClients();
    } catch (err) {
      setMessage(err.response?.data?.message || "Failed to create client");
    } finally {
      setLoading(false);
    }
  };

  // Filter clients based on search
  const filteredClients = clients.filter(client =>
    client.fullName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    client.phone?.includes(searchTerm) ||
    client.nationalId?.includes(searchTerm) ||
    client.educationLevel?.toLowerCase().includes(searchTerm.toLowerCase())
  );

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
      boxShadow: "0 10px 25px rgba(0,0,0,0.1)",
      transition: {
        type: "spring",
        stiffness: 400
      }
    }
  };

  const calculateTotalBalance = () => {
    return clients.reduce((total, client) => total + (client.balance || 0), 0);
  };

  // Enhanced Mobile Client Card Component
  const ClientCard = ({ client }) => {
    const isExpanded = expandedClient === client._id;
    
    return (
      <motion.div
        variants={cardVariants}
        initial="hidden"
        animate="visible"
        whileHover="hover"
        className="bg-white rounded-xl shadow-md p-3 mb-3 border border-gray-100 w-full"
      >
        <div 
          className="flex items-start space-x-3 cursor-pointer"
          onClick={() => setExpandedClient(isExpanded ? null : client._id)}
        >
          <div className="w-10 h-10 bg-gradient-to-r from-indigo-500 to-cyan-500 rounded-full flex items-center justify-center text-white font-bold flex-shrink-0 text-sm">
            {client.fullName?.charAt(0) || "C"}
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex justify-between items-start mb-1">
              <div className="flex-1 min-w-0">
                <h3 className="font-semibold text-gray-800 text-base truncate">{client.fullName}</h3>
                <p className="text-xs text-gray-500 truncate">{client.nationalId || "No ID"}</p>
              </div>
              <div className="flex items-center space-x-1 ml-2">
                <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold bg-green-100 text-green-800">
                  Active
                </span>
                <div className="text-gray-400">
                  {isExpanded ? <FaChevronUp size={10} /> : <FaChevronDown size={10} />}
                </div>
              </div>
            </div>
            
            {/* Always visible basic info */}
            <div className="space-y-1">
              <div className="flex items-center text-gray-600 text-xs">
                <FaPhone className="mr-1 text-green-500 flex-shrink-0" size={10} />
                <span className="truncate">{client.phone || "N/A"}</span>
              </div>
              <div className="flex items-center text-gray-700 text-xs font-semibold">
                <FaDollarSign className="mr-1 text-green-500 flex-shrink-0" size={10} />
                <span>Balance: {client.balance || "0.00"}</span>
              </div>
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
              className="mt-3 pt-3 border-t border-gray-100"
            >
              <div className="space-y-2">
                <div className="flex items-center text-gray-600 text-xs">
                  <FaMapMarkerAlt className="mr-2 text-red-500 flex-shrink-0" size={10} />
                  <span className="break-words">{client.address || "N/A"}</span>
                </div>
                <div className="flex items-center text-gray-600 text-xs">
                  <FaGraduationCap className="mr-2 text-purple-500 flex-shrink-0" size={10} />
                  <span>{client.educationLevel || "N/A"}</span>
                </div>
                <div className="flex items-center text-gray-600 text-xs">
                  <FaUserCheck className="mr-2 text-blue-500 flex-shrink-0" size={10} />
                  <span className="break-words">{client.guarantor ? client.guarantor.fullName : "No Guarantor"}</span>
                </div>
              </div>
              
              {/* Action Buttons */}
              <div className="flex justify-between space-x-2 mt-3 pt-3 border-t border-gray-100">
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  className="flex items-center gap-1 px-2 py-1.5 bg-blue-500 text-white rounded-lg text-xs shadow-md hover:shadow-lg transition-all duration-200 flex-1 justify-center"
                >
                  <FaEye size={10} />
                  View
                </motion.button>
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  className="flex items-center gap-1 px-2 py-1.5 bg-green-500 text-white rounded-lg text-xs shadow-md hover:shadow-lg transition-all duration-200 flex-1 justify-center mx-1"
                >
                  <FaEdit size={10} />
                  Edit
                </motion.button>
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  className="flex items-center gap-1 px-2 py-1.5 bg-red-500 text-white rounded-lg text-xs shadow-md hover:shadow-lg transition-all duration-200 flex-1 justify-center"
                >
                  <FaTrash size={10} />
                  Delete
                </motion.button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    );
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-cyan-50 p-2 sm:p-4 lg:p-6">
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="max-w-7xl mx-auto"
      >
        {/* Mobile Header */}
        <div className="lg:hidden  mb-3">
          <div className="flex items-center justify-between">
            <div className="flex-1">
              <h1 className="text-lg font-bold bg-gradient-to-r from-indigo-600 to-cyan-600 bg-clip-text text-transparent">
                Client Management
              </h1>
              <p className="text-xs text-gray-600 mt-0.5">
                {clients.length} clients • ${calculateTotalBalance().toLocaleString()} total
              </p>
            </div>
            <button
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="p-2 rounded-lg bg-white shadow-md border border-gray-200 ml-2"
            >
              {isMobileMenuOpen ? <FaTimes size={14} /> : <FaBars size={14} />}
            </button>
          </div>
        </div>

        {/* Header Section - Hidden on mobile, shown on desktop */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-3 lg:mb-8 hidden lg:block"
        >
          <h1 className="text-3xl lg:text-5xl font-bold bg-gradient-to-r from-indigo-600 to-cyan-600 bg-clip-text text-transparent mb-3 lg:mb-4">
            Client Management
          </h1>
          <p className="text-base lg:text-xl text-gray-600 max-w-2xl mx-auto">
            Manage your clients efficiently. Track client information, balances, and guarantor relationships.
          </p>
        </motion.div>

        {/* Stats Cards - Improved mobile layout */}
        <motion.div
          variants={containerVariants}
          initial="hidden"
          animate="visible"
          className="grid grid-cols-2 gap-2 sm:gap-3 lg:gap-6 mb-3 lg:mb-8"
        >
          {[
            { 
              icon: <FaUserTie size={14} className="sm:text-lg lg:text-3xl" />, 
              label: "Total", 
              value: clients.length, 
              color: "from-indigo-500 to-blue-500",
            },
            
            { 
              icon: <FaDollarSign size={14} className="sm:text-lg lg:text-3xl" />, 
              label: "Balance", 
              value: `$${calculateTotalBalance().toLocaleString()}`, 
              color: "from-purple-500 to-pink-500",
            },
            
          ].map((stat, index) => (
            <motion.div
              key={stat.label}
              variants={itemVariants}
              whileHover="hover"
              variants={cardVariants}
              className={`bg-gradient-to-br ${stat.color} text-white p-2 sm:p-3 lg:p-6 rounded-lg sm:rounded-xl lg:rounded-2xl shadow-sm lg:shadow-xl relative overflow-hidden group min-h-[60px] sm:min-h-[80px]`}
            >
              <div className="absolute -right-2 -top-2 sm:-right-3 sm:-top-3 lg:-right-4 lg:-top-4 w-6 h-6 sm:w-12 sm:h-12 lg:w-20 lg:h-20 bg-white/10 rounded-full group-hover:scale-150 transition-transform duration-500"></div>
              
              <div className="relative z-10">
                <div className="mb-0.5 sm:mb-2 lg:mb-3 transform group-hover:scale-110 transition-transform duration-300">
                  {stat.icon}
                </div>
                <p className="text-xs sm:text-lg lg:text-2xl font-bold truncate">{stat.value}</p>
                <p className="text-blue-100 text-xs truncate">{stat.label}</p>
              </div>
            </motion.div>
          ))}
        </motion.div>

        {/* Control Panel - Improved mobile layout */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-white/80 backdrop-blur-lg rounded-lg sm:rounded-xl lg:rounded-2xl shadow-md lg:shadow-xl p-3 sm:p-4 lg:p-6 mb-3 lg:mb-8 border border-white/20"
        >
          <div className={`flex flex-col space-y-3 sm:space-y-4 lg:space-y-0 lg:flex-row lg:gap-4 lg:items-center lg:justify-between ${isMobileMenuOpen ? 'block' : 'hidden lg:flex'}`}>
            {/* Search Bar */}
            <div className="relative flex-1 w-full">
              <FaSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 text-sm" />
              <input
                type="text"
                placeholder="Search clients..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-9 pr-3 py-2 sm:py-3 bg-white border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all duration-300 text-sm sm:text-base"
              />
            </div>

            {/* Action Buttons */}
            <div className="flex gap-2 sm:gap-3 w-full lg:w-auto">
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={fetchClients}
                disabled={isRefreshing}
                className="flex items-center gap-1 sm:gap-2 px-3 sm:px-4 lg:px-6 py-2 bg-gradient-to-r from-gray-600 to-gray-700 text-white rounded-lg lg:rounded-xl shadow-md hover:shadow-lg transition-all duration-300 disabled:opacity-50 text-xs sm:text-sm flex-1 lg:flex-none justify-center min-w-0"
              >
                <FaSync className={`${isRefreshing ? 'animate-spin' : ''} text-xs`} />
                <span className="truncate">{isRefreshing ? 'Refreshing...' : 'Refresh'}</span>
              </motion.button>

              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => {
                  setShowForm(!showForm);
                  setIsMobileMenuOpen(false);
                }}
                className="flex items-center gap-1 sm:gap-2 px-3 sm:px-4 lg:px-6 py-2 bg-gradient-to-r from-indigo-500 to-cyan-600 text-white rounded-lg lg:rounded-xl shadow-md hover:shadow-lg transition-all duration-300 text-xs sm:text-sm flex-1 lg:flex-none justify-center min-w-0"
              >
                <FaPlus className="text-xs" />
                <span className="truncate">Add Client</span>
              </motion.button>
            </div>
          </div>

          {/* Message Alert */}
          <AnimatePresence>
            {message && (
              <motion.div
                initial={{ opacity: 0, y: -10, scale: 0.9 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: -10, scale: 0.9 }}
                className={`mt-3 p-2 sm:p-3 rounded-lg text-center font-semibold text-xs sm:text-sm ${
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

        {/* Add Client Form - Improved mobile layout */}
        <AnimatePresence>
          {showForm && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ type: "spring", damping: 25 }}
              className="bg-white/90 backdrop-blur-lg rounded-lg sm:rounded-xl lg:rounded-2xl shadow-md lg:shadow-2xl p-3 sm:p-4 lg:p-6 mb-3 lg:mb-8 border border-white/20 overflow-hidden"
            >
              <motion.h3 
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                className="text-base sm:text-lg lg:text-2xl font-bold text-gray-800 mb-3 sm:mb-4 lg:mb-6 flex items-center gap-2"
              >
                <FaUserPlus className="text-indigo-500 text-sm sm:text-base" />
                Add New Client
              </motion.h3>

              <form onSubmit={handleSubmit} className="grid grid-cols-1 gap-3 sm:gap-4">
                {[
                  { name: "fullName", icon: FaUserTie, placeholder: "Full Name", type: "text", required: true },
                  { name: "phone", icon: FaPhone, placeholder: "Phone Number", type: "tel", required: false },
                  { name: "address", icon: FaMapMarkerAlt, placeholder: "Address", type: "text", required: false },
                  { name: "nationalId", icon: FaIdCard, placeholder: "National ID", type: "text", required: false },
                  { name: "educationLevel", icon: FaGraduationCap, placeholder: "Education Level", type: "text", required: false },
                ].map((field, index) => (
                  <motion.div
                    key={field.name}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.1 * index }}
                    className="relative"
                  >
                    <field.icon className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 text-sm" />
                    <input
                      type={field.type}
                      name={field.name}
                      value={form[field.name]}
                      onChange={handleChange}
                      placeholder={field.placeholder}
                      required={field.required}
                      className="w-full pl-9 pr-3 py-2 sm:py-3 bg-white border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all duration-300 hover:border-gray-300 text-sm sm:text-base"
                    />
                  </motion.div>
                ))}

                {/* Guarantor Select */}
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.5 }}
                  className="relative"
                >
                  <FaUserCheck className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 text-sm" />
                  <select 
                    name="guarantor" 
                    value={form.guarantor} 
                    onChange={handleChange}
                    className="w-full pl-9 pr-3 py-2 sm:py-3 bg-white border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all duration-300 hover:border-gray-300 appearance-none text-sm sm:text-base"
                  >
                    <option value="">Select Guarantor</option>
                    {guarantors.map(g => (
                      <option key={g._id} value={g._id}>{g.fullName}</option>
                    ))}
                  </select>
                </motion.div>
                
                <motion.button
                  type="submit"
                  disabled={loading}
                  whileHover={{ scale: loading ? 1 : 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  className="w-full bg-gradient-to-r from-indigo-500 to-cyan-600 text-white py-2 sm:py-3 rounded-lg lg:rounded-xl font-semibold text-sm sm:text-base shadow-md hover:shadow-lg transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {loading ? (
                    <div className="flex items-center justify-center gap-2">
                      <motion.div
                        animate={{ rotate: 360 }}
                        transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                        className="w-4 h-4 border-2 border-white border-t-transparent rounded-full"
                      />
                      Adding Client...
                    </div>
                  ) : (
                    "Add Client"
                  )}
                </motion.button>
              </form>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Clients List */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="bg-white/80 backdrop-blur-lg rounded-lg sm:rounded-xl lg:rounded-2xl shadow-md lg:shadow-xl overflow-hidden border border-white/20"
        >
          <div className="p-3 sm:p-4 border-b border-gray-200">
            <div className="flex items-center justify-between">
              <h3 className="text-base sm:text-lg lg:text-2xl font-bold text-gray-800 flex items-center gap-2">
                <FaUserTie className="text-indigo-500 text-sm sm:text-base" />
                <span>Clients</span>
                <span className="text-xs font-normal text-gray-500 bg-gray-100 px-2 py-0.5 rounded-full">
                  {filteredClients.length}
                </span>
              </h3>
              <div className="text-xs text-gray-500 lg:hidden">
                Tap to expand
              </div>
            </div>
          </div>

          {/* Mobile View - Enhanced Cards */}
          <div className="block lg:hidden p-2 sm:p-3">
            {loading ? (
              <div className="flex justify-center items-center py-6">
                <motion.div
                  animate={{ rotate: 360 }}
                  transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                  className="w-6 h-6 border-3 border-indigo-500 border-t-transparent rounded-full"
                />
              </div>
            ) : (
              <AnimatePresence>
                {filteredClients.length > 0 ? (
                  <motion.div
                    variants={containerVariants}
                    initial="hidden"
                    animate="visible"
                    className="space-y-2"
                  >
                    {filteredClients.map((client, index) => (
                      <ClientCard key={client._id} client={client} />
                    ))}
                  </motion.div>
                ) : (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="text-center py-6"
                  >
                    <div className="w-12 h-12 sm:w-16 sm:h-16 bg-gradient-to-r from-gray-200 to-gray-300 rounded-full flex items-center justify-center mx-auto mb-3">
                      <FaUserTie className="text-lg sm:text-2xl text-gray-400" />
                    </div>
                    <h4 className="text-base sm:text-lg font-semibold text-gray-500 mb-1">No Clients Found</h4>
                    <p className="text-gray-400 mb-3 text-xs sm:text-sm">Get started by adding your first client</p>
                    <motion.button
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={() => setShowForm(true)}
                      className="bg-gradient-to-r from-indigo-500 to-cyan-600 text-white px-3 py-1.5 sm:px-4 sm:py-2 rounded-lg shadow-md hover:shadow-lg transition-all duration-300 text-xs sm:text-sm"
                    >
                      <FaPlus className="inline mr-1" size={10} />
                      Add First Client
                    </motion.button>
                  </motion.div>
                )}
              </AnimatePresence>
            )}
          </div>

          {/* Desktop View - Table */}
          <div className="hidden lg:block overflow-x-auto">
            {loading ? (
              <div className="flex justify-center items-center py-12">
                <motion.div
                  animate={{ rotate: 360 }}
                  transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                  className="w-8 h-8 border-4 border-indigo-500 border-t-transparent rounded-full"
                />
              </div>
            ) : (
              <table className="w-full">
                <thead>
                  <tr className="bg-gradient-to-r from-gray-50 to-indigo-50">
                    {["Client", "Contact", "Location", "Education", "Guarantor", "Balance", "Status"].map((header) => (
                      <th key={header} className="px-6 py-4 text-left text-sm font-semibold text-gray-700 uppercase tracking-wider">
                        {header}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  <AnimatePresence>
                    {filteredClients.map((client, index) => (
                      <motion.tr
                        key={client._id}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: index * 0.05 }}
                        whileHover={{ backgroundColor: "rgba(99, 102, 241, 0.05)" }}
                        className="group transition-all duration-300"
                      >
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center">
                            <div className="w-10 h-10 bg-gradient-to-r from-indigo-500 to-cyan-500 rounded-full flex items-center justify-center text-white font-bold mr-3">
                              {client.fullName?.charAt(0) || "C"}
                            </div>
                            <div>
                              <p className="font-semibold text-gray-800">{client.fullName}</p>
                              <p className="text-sm text-gray-500">{client.nationalId}</p>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center text-gray-600">
                            <FaPhone className="mr-2 text-green-500" />
                            {client.phone || "N/A"}
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex items-center text-gray-600 max-w-xs">
                            <FaMapMarkerAlt className="mr-2 text-red-500 flex-shrink-0" />
                            <span className="truncate">{client.address || "N/A"}</span>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center text-gray-600">
                            <FaGraduationCap className="mr-2 text-purple-500" />
                            {client.educationLevel || "N/A"}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center">
                            {client.guarantor ? (
                              <>
                                <div className="w-8 h-8 bg-gradient-to-r from-green-500 to-emerald-500 rounded-full flex items-center justify-center text-white text-xs font-bold mr-2">
                                  G
                                </div>
                                <span className="text-gray-700">{client.guarantor.fullName}</span>
                              </>
                            ) : (
                              <span className="text-gray-400 italic">No Guarantor</span>
                            )}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center text-gray-700 font-semibold">
                            <FaDollarSign className="mr-1 text-green-500" />
                            {client.balance || "0.00"}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-semibold bg-green-100 text-green-800">
                            Active
                          </span>
                        </td>
                      </motion.tr>
                    ))}
                  </AnimatePresence>
                </tbody>
              </table>
            )}

            {filteredClients.length === 0 && !loading && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="text-center py-12"
              >
                <div className="w-24 h-24 bg-gradient-to-r from-gray-200 to-gray-300 rounded-full flex items-center justify-center mx-auto mb-4">
                  <FaUserTie className="text-3xl text-gray-400" />
                </div>
                <h4 className="text-xl font-semibold text-gray-500 mb-2">No Clients Found</h4>
                <p className="text-gray-400 mb-4">Get started by adding your first client</p>
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => setShowForm(true)}
                  className="bg-gradient-to-r from-indigo-500 to-cyan-600 text-white px-6 py-3 rounded-xl shadow-lg hover:shadow-xl transition-all duration-300"
                >
                  <FaPlus className="inline mr-2" />
                  Add First Client
                </motion.button>
              </motion.div>
            )}
          </div>
        </motion.div>
      </motion.div>

      {/* Background Decorations */}
      <div className="fixed inset-0 -z-10 overflow-hidden">
        <div className="absolute -top-20 -right-20 w-40 h-40 lg:w-80 lg:h-80 bg-indigo-200 rounded-full blur-3xl opacity-30 animate-pulse"></div>
        <div className="absolute -bottom-20 -left-20 w-40 h-40 lg:w-80 lg:h-80 bg-cyan-200 rounded-full blur-3xl opacity-30 animate-pulse delay-1000"></div>
      </div>
    </div>
  );
};

export default Client;