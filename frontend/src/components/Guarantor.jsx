// Guarantor.jsx
import React, { useState, useEffect } from "react";
import axios from "axios";
import { motion, AnimatePresence } from "framer-motion";
import {
  FaUserPlus,
  FaSearch,
  FaEdit,
  FaTrash,
  FaUserCheck,
  FaPhone,
  FaMapMarkerAlt,
  FaIdCard,
  FaPlus,
  FaSync,
  FaFilter,
  FaBars,
  FaTimes,
} from "react-icons/fa";

const Guarantor = () => {
  const [guarantors, setGuarantors] = useState([]);
  const [form, setForm] = useState({
    fullName: "",
    phone: "",
    address: "",
    nationalId: "",
  });
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  // Fetch guarantors from backend
  const fetchGuarantors = async () => {
    try {
      setIsRefreshing(true);
      const token = localStorage.getItem("token");
      const res = await axios.get("/api/guarantors", {
        headers: { Authorization: `Bearer ${token}` },
      });
      setGuarantors(res.data);
    } catch (err) {
      console.error(err);
      setMessage("❌ Failed to fetch guarantors");
    } finally {
      setIsRefreshing(false);
    }
  };

  useEffect(() => {
    fetchGuarantors();
  }, []);

  // Handle form change
  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  // Handle form submit
  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage("");

    try {
      const token = localStorage.getItem("token");
      const res = await axios.post(
        "/api/guarantors",
        form,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      setMessage("✅ Guarantor added successfully!");
      setForm({ fullName: "", phone: "", address: "", nationalId: "" });
      setShowForm(false);
      fetchGuarantors();
    } catch (err) {
      const errorMsg = err.response?.data?.message || err.message;
      setMessage(`❌ ${errorMsg}`);
    } finally {
      setLoading(false);
    }
  };

  // Filter guarantors based on search
  const filteredGuarantors = guarantors.filter(
    (guarantor) =>
      guarantor.fullName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      guarantor.phone?.includes(searchTerm) ||
      guarantor.nationalId?.includes(searchTerm)
  );

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
      },
    },
  };

  const itemVariants = {
    hidden: { y: 20, opacity: 0 },
    visible: {
      y: 0,
      opacity: 1,
      transition: {
        type: "spring",
        stiffness: 100,
      },
    },
  };

  const cardVariants = {
    hidden: { scale: 0.9, opacity: 0 },
    visible: {
      scale: 1,
      opacity: 1,
      transition: {
        type: "spring",
        stiffness: 300,
        damping: 25,
      },
    },
    hover: {
      scale: 1.02,
      y: -5,
      boxShadow: "0 20px 40px rgba(0,0,0,0.1)",
      transition: {
        type: "spring",
        stiffness: 400,
      },
    },
  };

  // Mobile responsive card component for guarantors
  const GuarantorCard = ({ guarantor }) => (
    <motion.div
      variants={cardVariants}
      initial="hidden"
      animate="visible"
      whileHover="hover"
      className="bg-white rounded-2xl shadow-lg p-4 mb-4 border border-gray-100"
    >
      <div className="flex items-start space-x-4">
        <div className="w-12 h-12 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full flex items-center justify-center text-white font-bold flex-shrink-0">
          {guarantor.fullName?.charAt(0) || "G"}
        </div>
        <div className="flex-1 min-w-0">
          <h3 className="font-semibold text-gray-800 text-lg truncate">
            {guarantor.fullName}
          </h3>
          <div className="space-y-2 mt-2">
            <div className="flex items-center text-gray-600 text-sm">
              <FaPhone className="mr-2 text-green-500 flex-shrink-0" />
              <span className="truncate">{guarantor.phone}</span>
            </div>
            <div className="flex items-center text-gray-600 text-sm">
              <FaMapMarkerAlt className="mr-2 text-red-500 flex-shrink-0" />
              <span className="truncate">{guarantor.address}</span>
            </div>
            <div className="flex items-center text-gray-600 text-sm">
              <FaIdCard className="mr-2 text-orange-500 flex-shrink-0" />
              <span className="truncate">{guarantor.nationalId}</span>
            </div>
          </div>
          <div className="mt-3 flex justify-between items-center">
            <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-semibold bg-green-100 text-green-800">
              Active
            </span>
            <div className="flex space-x-2">
              <button className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors">
                {/* <FaEdit size={14} /> */}
              </button>
              <button className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors">
                {/* <FaTrash size={14} /> */}
              </button>
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 p-4 sm:p-6">
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="max-w-7xl mx-auto"
      >
        {/* Mobile Header */}
        <div className="lg:hidden mb-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                Guarantors
              </h1>
              <p className="text-sm text-gray-600 mt-1">
                {guarantors.length} total guarantors
              </p>
            </div>
            <button
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="p-2 rounded-lg bg-white shadow-lg border border-gray-200"
            >
              {isMobileMenuOpen ? <FaTimes /> : <FaBars />}
            </button>
          </div>
        </div>

        {/* Header Section */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-6 lg:mb-8"
        >
          <h1 className="text-3xl lg:text-5xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent mb-3 lg:mb-4">
            Guarantor Management
          </h1>
          <p className="text-base lg:text-xl text-gray-600 max-w-2xl mx-auto px-4">
            Manage your guarantors with ease. Add, view, and organize all
            guarantor information in one place.
          </p>
        </motion.div>

        {/* Stats Cards */}
        <motion.div
          variants={containerVariants}
          initial="hidden"
          animate="visible"
          className="grid grid-cols-2 lg:grid-cols-4 gap-3 lg:gap-6 mb-6 lg:mb-8"
        >
          {[
            {
              icon: <FaUserCheck />,
              label: "Total",
              value: guarantors.length,
              color: "from-blue-500 to-cyan-500",
            },
            {
              icon: <FaUserPlus />,
              label: "Active",
              value: guarantors.length,
              color: "from-green-500 to-emerald-500",
            },
            {
              icon: <FaIdCard />,
              label: "Verified",
              value: guarantors.length,
              color: "from-purple-500 to-pink-500",
            },
            {
              icon: <FaSync />,
              label: "Pending",
              value: 0,
              color: "from-orange-500 to-red-500",
            },
          ].map((stat, index) => (
            <motion.div
              key={stat.label}
              variants={itemVariants}
              whileHover="hover"
              variants={cardVariants}
              className={`bg-gradient-to-br ${stat.color} text-white p-3 lg:p-6 rounded-xl lg:rounded-2xl shadow-lg relative overflow-hidden group`}
            >
              <div className="absolute -right-3 -top-3 lg:-right-4 lg:-top-4 w-12 h-12 lg:w-20 lg:h-20 bg-white/10 rounded-full group-hover:scale-150 transition-transform duration-500"></div>
              <div className="relative z-10">
                <div className="text-xl lg:text-3xl mb-2 lg:mb-3 transform group-hover:scale-110 transition-transform duration-300">
                  {stat.icon}
                </div>
                <p className="text-lg lg:text-2xl font-bold">{stat.value}</p>
                <p className="text-blue-100 text-xs lg:text-sm">{stat.label}</p>
              </div>
            </motion.div>
          ))}
        </motion.div>

        {/* Control Panel */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-white/80 backdrop-blur-lg rounded-xl lg:rounded-2xl shadow-lg lg:shadow-xl p-4 lg:p-6 mb-6 lg:mb-8 border border-white/20"
        >
          <div
            className={`flex flex-col space-y-4 lg:space-y-0 lg:flex-row lg:gap-4 lg:items-center lg:justify-between ${
              isMobileMenuOpen ? "block" : "hidden lg:flex"
            }`}
          >
            {/* Search Bar */}
            <div className="relative flex-1">
              <FaSearch className="absolute left-3 lg:left-4 top-1/2 transform -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                placeholder="Search guarantors..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 lg:pl-12 pr-4 py-2 lg:py-3 bg-white border border-gray-200 rounded-lg lg:rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-300"
              />
            </div>

            {/* Action Buttons */}
            <div className="flex gap-2 lg:gap-3">
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={fetchGuarantors}
                disabled={isRefreshing}
                className="flex items-center gap-2 px-4 lg:px-6 py-2 lg:py-3 bg-gradient-to-r from-gray-600 to-gray-700 text-white rounded-lg lg:rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 disabled:opacity-50 text-sm lg:text-base flex-1 lg:flex-none justify-center"
              >
                <FaSync className={`${isRefreshing ? "animate-spin" : ""}`} />
                <span className="hidden sm:inline">
                  {isRefreshing ? "Refreshing..." : "Refresh"}
                </span>
              </motion.button>

              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => {
                  setShowForm(!showForm);
                  setIsMobileMenuOpen(false);
                }}
                className="flex items-center gap-2 px-4 lg:px-6 py-2 lg:py-3 bg-gradient-to-r from-blue-500 to-purple-600 text-white rounded-lg lg:rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 text-sm lg:text-base flex-1 lg:flex-none justify-center"
              >
                <FaPlus />
                <span>Add Guarantor</span>
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
                className={`mt-4 p-3 lg:p-4 rounded-lg lg:rounded-xl text-center font-semibold text-sm lg:text-base ${
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

        {/* Add Guarantor Form */}
        <AnimatePresence>
          {showForm && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ type: "spring", damping: 25 }}
              className="bg-white/90 backdrop-blur-lg rounded-xl lg:rounded-2xl shadow-lg lg:shadow-2xl p-4 lg:p-6 mb-6 lg:mb-8 border border-white/20 overflow-hidden"
            >
              <motion.h3
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                className="text-xl lg:text-2xl font-bold text-gray-800 mb-4 lg:mb-6 flex items-center gap-3"
              >
                <FaUserPlus className="text-blue-500" />
                Add New Guarantor
              </motion.h3>

              <form
                onSubmit={handleSubmit}
                className="grid grid-cols-1 md:grid-cols-2 gap-4 lg:gap-6"
              >
                {[
                  {
                    name: "fullName",
                    icon: FaUserCheck,
                    placeholder: "Full Name",
                    type: "text",
                  },
                  {
                    name: "phone",
                    icon: FaPhone,
                    placeholder: "Phone Number",
                    type: "tel",
                  },
                  {
                    name: "address",
                    icon: FaMapMarkerAlt,
                    placeholder: "Address",
                    type: "text",
                  },
                  {
                    name: "nationalId",
                    icon: FaIdCard,
                    placeholder: "National ID",
                    type: "text",
                  },
                ].map((field, index) => (
                  <motion.div
                    key={field.name}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.1 * index }}
                    className="relative md:col-span-1"
                  >
                    <field.icon className="absolute left-3 lg:left-4 top-1/2 transform -translate-y-1/2 text-gray-400 text-lg" />
                    <input
                      type={field.type}
                      name={field.name}
                      value={form[field.name]}
                      onChange={handleChange}
                      placeholder={field.placeholder}
                      required
                      className="w-full pl-10 lg:pl-12 pr-4 py-3 lg:py-4 bg-white border border-gray-200 rounded-lg lg:rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-300 hover:border-gray-300"
                    />
                  </motion.div>
                ))}

                <motion.button
                  type="submit"
                  disabled={loading}
                  whileHover={{ scale: loading ? 1 : 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  className="col-span-1 md:col-span-2 bg-gradient-to-r from-blue-500 to-purple-600 text-white py-3 lg:py-4 rounded-lg lg:rounded-xl font-semibold text-base lg:text-lg shadow-lg hover:shadow-xl transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {loading ? (
                    <div className="flex items-center justify-center gap-2">
                      <motion.div
                        animate={{ rotate: 360 }}
                        transition={{
                          duration: 1,
                          repeat: Infinity,
                          ease: "linear",
                        }}
                        className="w-4 h-4 lg:w-5 lg:h-5 border-2 border-white border-t-transparent rounded-full"
                      />
                      Adding Guarantor...
                    </div>
                  ) : (
                    "Add Guarantor"
                  )}
                </motion.button>
              </form>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Guarantors List */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="bg-white/80 backdrop-blur-lg rounded-xl lg:rounded-2xl shadow-lg lg:shadow-xl overflow-hidden border border-white/20"
        >
          <div className="p-4 lg:p-6 border-b border-gray-200">
            <h3 className="text-xl lg:text-2xl font-bold text-gray-800 flex items-center gap-3">
              <FaUserCheck className="text-green-500" />
              Guarantors List
              <span className="text-xs lg:text-sm font-normal text-gray-500 bg-gray-100 px-2 lg:px-3 py-1 rounded-full ml-2">
                {filteredGuarantors.length} records
              </span>
            </h3>
          </div>

          {/* Mobile View - Cards */}
          <div className="lg:hidden p-4">
            <AnimatePresence>
              {filteredGuarantors.length > 0 ? (
                <motion.div
                  variants={containerVariants}
                  initial="hidden"
                  animate="visible"
                >
                  {filteredGuarantors.map((guarantor, index) => (
                    <GuarantorCard key={guarantor._id} guarantor={guarantor} />
                  ))}
                </motion.div>
              ) : (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="text-center py-8"
                >
                  <div className="w-16 h-16 bg-gradient-to-r from-gray-200 to-gray-300 rounded-full flex items-center justify-center mx-auto mb-4">
                    <FaUserCheck className="text-2xl text-gray-400" />
                  </div>
                  <h4 className="text-lg font-semibold text-gray-500 mb-2">
                    No Guarantors Found
                  </h4>
                  <p className="text-gray-400 mb-4 text-sm">
                    Get started by adding your first guarantor
                  </p>
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => setShowForm(true)}
                    className="bg-gradient-to-r from-blue-500 to-purple-600 text-white px-4 py-2 rounded-lg shadow-lg hover:shadow-xl transition-all duration-300 text-sm"
                  >
                    <FaPlus className="inline mr-2" />
                    Add First Guarantor
                  </motion.button>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Desktop View - Table */}
          <div className="hidden lg:block overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="bg-gradient-to-r from-gray-50 to-blue-50">
                  {[
                    "Full Name",
                    "Phone",
                    "Address",
                    "National ID",
                    "Status",
                  ].map((header) => (
                    <th
                      key={header}
                      className="px-6 py-4 text-left text-sm font-semibold text-gray-700 uppercase tracking-wider"
                    >
                      {header}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                <AnimatePresence>
                  {filteredGuarantors.map((guarantor, index) => (
                    <motion.tr
                      key={guarantor._id}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: index * 0.05 }}
                      whileHover={{
                        backgroundColor: "rgba(59, 130, 246, 0.05)",
                      }}
                      className="group transition-all duration-300"
                    >
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full flex items-center justify-center text-white font-bold mr-3">
                            {guarantor.fullName?.charAt(0) || "G"}
                          </div>
                          <div>
                            <p className="font-semibold text-gray-800">
                              {guarantor.fullName}
                            </p>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center text-gray-600">
                          <FaPhone className="mr-2 text-green-500" />
                          {guarantor.phone}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center text-gray-600 max-w-xs">
                          <FaMapMarkerAlt className="mr-2 text-red-500 flex-shrink-0" />
                          <span className="truncate">{guarantor.address}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center text-gray-600">
                          <FaIdCard className="mr-2 text-orange-500" />
                          {guarantor.nationalId}
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

            {filteredGuarantors.length === 0 && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="text-center py-12"
              >
                <div className="w-24 h-24 bg-gradient-to-r from-gray-200 to-gray-300 rounded-full flex items-center justify-center mx-auto mb-4">
                  <FaUserCheck className="text-3xl text-gray-400" />
                </div>
                <h4 className="text-xl font-semibold text-gray-500 mb-2">
                  No Guarantors Found
                </h4>
                <p className="text-gray-400 mb-4">
                  Get started by adding your first guarantor
                </p>
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => setShowForm(true)}
                  className="bg-gradient-to-r from-blue-500 to-purple-600 text-white px-6 py-3 rounded-xl shadow-lg hover:shadow-xl transition-all duration-300"
                >
                  <FaPlus className="inline mr-2" />
                  Add First Guarantor
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

export default Guarantor;
