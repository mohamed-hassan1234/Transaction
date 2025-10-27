import React, { useState, useEffect } from "react";
import axios from "axios";
import { motion, AnimatePresence } from "framer-motion";
import { 
  FaUser, 
  FaEnvelope, 
  FaLock, 
  FaSave, 
  FaTrash, 
  FaShieldAlt,
  FaEye,
  FaEyeSlash,
  FaCheckCircle,
  FaExclamationTriangle,
  FaUserEdit,
  FaKey,
  FaBell,
  FaPalette
} from "react-icons/fa";

const Profile = () => {
  const storedUser = JSON.parse(localStorage.getItem("user"));
  const token = localStorage.getItem("token");

  const [form, setForm] = useState({
    name: storedUser?.name || "",
    email: storedUser?.email || "",
    password: "",
    confirmPassword: ""
  });
  const [message, setMessage] = useState({ type: "", text: "" });
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [activeTab, setActiveTab] = useState("profile");

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
    // Clear message when user starts typing
    if (message.text) setMessage({ type: "", text: "" });
  };

  const handleUpdate = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage({ type: "", text: "" });

    // Validate passwords match
    if (form.password && form.password !== form.confirmPassword) {
      setMessage({ type: "error", text: "❌ Passwords do not match" });
      setLoading(false);
      return;
    }

    try {
      const res = await axios.put(
        "http://localhost:5001/api/auth/profile",
        form,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setMessage({ type: "success", text: "✅ Profile updated successfully!" });
      localStorage.setItem("user", JSON.stringify(res.data.user));
      
      // Clear password fields
      setForm(prev => ({ ...prev, password: "", confirmPassword: "" }));
    } catch (err) {
      setMessage({ 
        type: "error", 
        text: `❌ ${err.response?.data?.message || "Update failed"}` 
      });
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!window.confirm("Are you absolutely sure you want to delete your account? This action cannot be undone!")) return;
    
    try {
      await axios.delete("http://localhost:5001/api/auth/profile", {
        headers: { Authorization: `Bearer ${token}` },
      });
      setMessage({ type: "success", text: "✅ Account deleted successfully" });
      localStorage.clear();
      setTimeout(() => (window.location.href = "/login"), 2000);
    } catch (err) {
      setMessage({ 
        type: "error", 
        text: `❌ ${err.response?.data?.message || "Delete failed"}` 
      });
    }
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
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-purple-50 p-4 sm:p-6">
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="max-w-4xl mx-auto"
      >
        {/* Header Section */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-8"
        >
          <h1 className="text-4xl lg:text-6xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent mb-4">
            👤 Your Profile
          </h1>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
            Manage your account settings and preferences
          </p>
        </motion.div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 lg:gap-8">
          {/* Sidebar Navigation */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.2 }}
            className="lg:col-span-1"
          >
            <div className="bg-white/80 backdrop-blur-lg rounded-2xl shadow-xl p-6 border border-white/20">
              <div className="text-center mb-6">
                <motion.div
                  whileHover={{ scale: 1.1 }}
                  className="w-20 h-20 bg-gradient-to-r from-indigo-500 to-purple-500 rounded-full flex items-center justify-center text-white text-2xl font-bold mx-auto mb-3 shadow-lg"
                >
                  {storedUser?.name?.charAt(0)?.toUpperCase() || "U"}
                </motion.div>
                <h3 className="font-bold text-gray-800 text-lg">{storedUser?.name}</h3>
                <p className="text-gray-600 text-sm">{storedUser?.email}</p>
              </div>

              <nav className="space-y-2">
                {[
                  { id: "profile", icon: <FaUserEdit />, label: "Profile" },
                //   { id: "security", icon: <FaShieldAlt />, label: "Security" },
                //   { id: "notifications", icon: <FaBell />, label: "Notifications" },
                //   { id: "appearance", icon: <FaPalette />, label: "Appearance" }
                ].map((item) => (
                  <motion.button
                    key={item.id}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => setActiveTab(item.id)}
                    className={`w-full text-left p-3 rounded-xl transition-all duration-300 flex items-center gap-3 ${
                      activeTab === item.id
                        ? "bg-gradient-to-r from-indigo-500 to-purple-500 text-white shadow-lg"
                        : "bg-gray-50 text-gray-700 hover:bg-gray-100"
                    }`}
                  >
                    <div className="text-lg">
                      {item.icon}
                    </div>
                    <span className="font-semibold">{item.label}</span>
                  </motion.button>
                ))}
              </nav>
            </div>
          </motion.div>

          {/* Main Content */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.3 }}
            className="lg:col-span-3"
          >
            <div className="bg-white/80 backdrop-blur-lg rounded-2xl shadow-xl p-6 lg:p-8 border border-white/20">
              {/* Profile Tab Content */}
              <AnimatePresence mode="wait">
                {activeTab === "profile" && (
                  <motion.div
                    key="profile"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -20 }}
                    transition={{ duration: 0.3 }}
                  >
                    <div className="flex items-center gap-3 mb-6">
                      <FaUserEdit className="text-2xl text-indigo-500" />
                      <h2 className="text-2xl font-bold text-gray-800">Profile Information</h2>
                    </div>

                    {/* Message Alert */}
                    <AnimatePresence>
                      {message.text && (
                        <motion.div
                          initial={{ opacity: 0, y: -10, scale: 0.9 }}
                          animate={{ opacity: 1, y: 0, scale: 1 }}
                          exit={{ opacity: 0, y: -10, scale: 0.9 }}
                          className={`mb-6 p-4 rounded-xl text-center font-semibold ${
                            message.type === "success" 
                              ? "bg-gradient-to-r from-green-500 to-emerald-500 text-white" 
                              : "bg-gradient-to-r from-red-500 to-orange-500 text-white"
                          }`}
                        >
                          <div className="flex items-center justify-center gap-3">
                            {message.type === "success" ? (
                              <FaCheckCircle className="text-xl" />
                            ) : (
                              <FaExclamationTriangle className="text-xl" />
                            )}
                            {message.text}
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>

                    <form onSubmit={handleUpdate} className="space-y-6">
                      <motion.div
                        variants={containerVariants}
                        initial="hidden"
                        animate="visible"
                        className="grid grid-cols-1 lg:grid-cols-2 gap-6"
                      >
                        {/* Name Field */}
                        <motion.div variants={itemVariants}>
                          <label className="block text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2">
                            <FaUser className="text-indigo-500" />
                            Full Name
                          </label>
                          <div className="relative">
                            <input
                              type="text"
                              name="name"
                              value={form.name}
                              onChange={handleChange}
                              className="w-full pl-12 pr-4 py-4 bg-white border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all duration-300 hover:border-gray-300"
                              placeholder="Enter your full name"
                            />
                            <FaUser className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 text-lg" />
                          </div>
                        </motion.div>

                        {/* Email Field */}
                        <motion.div variants={itemVariants}>
                          <label className="block text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2">
                            <FaEnvelope className="text-indigo-500" />
                            Email Address
                          </label>
                          <div className="relative">
                            <input
                              type="email"
                              name="email"
                              value={form.email}
                              onChange={handleChange}
                              className="w-full pl-12 pr-4 py-4 bg-white border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all duration-300 hover:border-gray-300"
                              placeholder="Enter your email"
                            />
                            <FaEnvelope className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 text-lg" />
                          </div>
                        </motion.div>

                        {/* Password Field */}
                        <motion.div variants={itemVariants}>
                          <label className="block text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2">
                            <FaLock className="text-indigo-500" />
                            New Password
                          </label>
                          <div className="relative">
                            <input
                              type={showPassword ? "text" : "password"}
                              name="password"
                              value={form.password}
                              onChange={handleChange}
                              className="w-full pl-12 pr-12 py-4 bg-white border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all duration-300 hover:border-gray-300"
                              placeholder="Enter new password"
                            />
                            <FaLock className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 text-lg" />
                            <button
                              type="button"
                              onClick={() => setShowPassword(!showPassword)}
                              className="absolute right-4 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
                            >
                              {showPassword ? <FaEyeSlash /> : <FaEye />}
                            </button>
                          </div>
                        </motion.div>

                        {/* Confirm Password Field */}
                        <motion.div variants={itemVariants}>
                          <label className="block text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2">
                            <FaKey className="text-indigo-500" />
                            Confirm Password
                          </label>
                          <div className="relative">
                            <input
                              type={showConfirmPassword ? "text" : "password"}
                              name="confirmPassword"
                              value={form.confirmPassword}
                              onChange={handleChange}
                              className="w-full pl-12 pr-12 py-4 bg-white border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all duration-300 hover:border-gray-300"
                              placeholder="Confirm new password"
                            />
                            <FaKey className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 text-lg" />
                            <button
                              type="button"
                              onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                              className="absolute right-4 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
                            >
                              {showConfirmPassword ? <FaEyeSlash /> : <FaEye />}
                            </button>
                          </div>
                        </motion.div>
                      </motion.div>

                      {/* Action Buttons */}
                      <div className="flex flex-col sm:flex-row gap-4 pt-6 border-t border-gray-200">
                        <motion.button
                          type="submit"
                          disabled={loading}
                          whileHover={{ scale: loading ? 1 : 1.02 }}
                          whileTap={{ scale: 0.98 }}
                          className="flex items-center justify-center gap-3 px-8 py-4 bg-gradient-to-r from-indigo-500 to-purple-600 text-white rounded-xl font-semibold shadow-lg hover:shadow-xl transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed flex-1"
                        >
                          {loading ? (
                            <motion.div
                              animate={{ rotate: 360 }}
                              transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                              className="w-5 h-5 border-2 border-white border-t-transparent rounded-full"
                            />
                          ) : (
                            <FaSave />
                          )}
                          {loading ? "Updating Profile..." : "Update Profile"}
                        </motion.button>

                        <motion.button
                          type="button"
                          onClick={handleDelete}
                          whileHover={{ scale: 1.02 }}
                          whileTap={{ scale: 0.98 }}
                          className="flex items-center justify-center gap-3 px-8 py-4 bg-gradient-to-r from-red-500 to-orange-500 text-white rounded-xl font-semibold shadow-lg hover:shadow-xl transition-all duration-300 flex-1"
                        >
                          <FaTrash />
                          Delete Account
                        </motion.button>
                      </div>
                    </form>
                  </motion.div>
                )}

                {/* Other Tabs Placeholder */}
                {activeTab !== "profile" && (
                  <motion.div
                    key={activeTab}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -20 }}
                    transition={{ duration: 0.3 }}
                    className="text-center py-12"
                  >
                    <div className="w-24 h-24 bg-gradient-to-r from-gray-200 to-gray-300 rounded-full flex items-center justify-center mx-auto mb-6">
                      {activeTab === "security" && <FaShieldAlt className="text-3xl text-gray-400" />}
                      {activeTab === "notifications" && <FaBell className="text-3xl text-gray-400" />}
                      {activeTab === "appearance" && <FaPalette className="text-3xl text-gray-400" />}
                    </div>
                    <h3 className="text-2xl font-bold text-gray-800 mb-3 capitalize">
                      {activeTab} Settings
                    </h3>
                    <p className="text-gray-600 max-w-md mx-auto">
                      This section is coming soon! We're working on bringing you more customization options.
                    </p>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </motion.div>
        </div>

        {/* Security Tips */}
        {/* <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
          className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-6"
        >
          <div className="bg-white/80 backdrop-blur-lg rounded-2xl shadow-lg p-6 text-center border border-white/20">
            <FaShieldAlt className="text-3xl text-green-500 mx-auto mb-3" />
            <h4 className="font-semibold text-gray-800 mb-2">Secure</h4>
            <p className="text-sm text-gray-600">Your data is encrypted and protected</p>
          </div>
          <div className="bg-white/80 backdrop-blur-lg rounded-2xl shadow-lg p-6 text-center border border-white/20">
            <FaUser className="text-3xl text-blue-500 mx-auto mb-3" />
            <h4 className="font-semibold text-gray-800 mb-2">Personalized</h4>
            <p className="text-sm text-gray-600">Customize your experience</p>
          </div>
          <div className="bg-white/80 backdrop-blur-lg rounded-2xl shadow-lg p-6 text-center border border-white/20">
            <FaBell className="text-3xl text-purple-500 mx-auto mb-3" />
            <h4 className="font-semibold text-gray-800 mb-2">Notifications</h4>
            <p className="text-sm text-gray-600">Stay updated with alerts</p>
          </div>
        </motion.div> */}
      </motion.div>

      {/* Background Decorations */}
      <div className="fixed inset-0 -z-10 overflow-hidden">
        <div className="absolute -top-40 -right-40 w-60 h-60 lg:w-80 lg:h-80 bg-indigo-200 rounded-full blur-3xl opacity-30 animate-pulse"></div>
        <div className="absolute -bottom-40 -left-40 w-60 h-60 lg:w-80 lg:h-80 bg-purple-200 rounded-full blur-3xl opacity-30 animate-pulse delay-1000"></div>
      </div>
    </div>
  );
};

export default Profile;