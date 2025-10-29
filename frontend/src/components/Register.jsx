import React, { useState } from "react";
import axios from "axios";
import { Link, useNavigate } from "react-router-dom"; // 👈 Added useNavigate
import { motion, AnimatePresence } from "framer-motion";
import { 
  FaUser, 
  FaEnvelope, 
  FaLock, 
  FaUserShield, 
  FaEye, 
  FaEyeSlash,
  FaCheckCircle,
  FaExclamationTriangle,
  FaArrowLeft,
  FaRocket
} from "react-icons/fa";
import Swal from 'sweetalert2';

const Register = () => {
  const [form, setForm] = useState({
    name: "",
    email: "",
    password: "",
    role: "cashier",
  });
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [formErrors, setFormErrors] = useState({});
  const navigate = useNavigate(); // 👈 Added navigate hook

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm({ ...form, [name]: value });
    
    // Clear error when user starts typing
    if (formErrors[name]) {
      setFormErrors(prev => ({ ...prev, [name]: "" }));
    }
  };

  const validateForm = () => {
    const errors = {};
    
    if (!form.name.trim()) {
      errors.name = "Full name is required";
    } else if (form.name.length < 2) {
      errors.name = "Name must be at least 2 characters";
    }
    
    if (!form.email.trim()) {
      errors.email = "Email is required";
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) {
      errors.email = "Please enter a valid email address";
    }
    
    if (!form.password) {
      errors.password = "Password is required";
    } else if (form.password.length < 6) {
      errors.password = "Password must be at least 6 characters";
    }
    
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMessage("");
    
    if (!validateForm()) {
      return;
    }

    setLoading(true);

    try {
      const res = await axios.post(
        "/api/auth/register",
        form
      );

      // Show beautiful success alert
      await Swal.fire({
        title: '🎉 Success!',
        text: 'User registered successfully!',
        icon: 'success',
        background: '#f0fdf4',
        color: '#065f46',
        confirmButtonText: 'Continue',
        confirmButtonColor: '#10b981',
        iconColor: '#10b981',
        customClass: {
          popup: 'rounded-2xl shadow-2xl',
          title: 'text-2xl font-bold',
          confirmButton: 'px-6 py-2 rounded-lg font-semibold'
        }
      });

      setForm({ name: "", email: "", password: "", role: "cashier" });
      setFormErrors({});
      
      // 👇 Navigate to login page after successful registration
      navigate("/"); // This will redirect to your login page
      
    } catch (err) {
      const errorMsg = err.response?.data?.message || err.message || "Registration failed";
      
      // Show beautiful error alert
      await Swal.fire({
        title: '❌ Registration Failed',
        text: errorMsg,
        icon: 'error',
        background: '#fef2f2',
        color: '#991b1b',
        confirmButtonText: 'Try Again',
        confirmButtonColor: '#ef4444',
        iconColor: '#ef4444',
        customClass: {
          popup: 'rounded-2xl shadow-2xl',
          title: 'text-2xl font-bold',
          confirmButton: 'px-6 py-2 rounded-lg font-semibold'
        }
      });
    } finally {
      setLoading(false);
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

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 flex items-center justify-center p-4">
      {/* Background Decorations */}
      <div className="fixed inset-0 overflow-hidden -z-10">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-blue-200 rounded-full blur-3xl opacity-30 animate-pulse"></div>
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-purple-200 rounded-full blur-3xl opacity-30 animate-pulse delay-1000"></div>
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-indigo-100 rounded-full blur-3xl opacity-20"></div>
      </div>

      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-md"
      >
        {/* Back Button */}
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.2 }}
          className="mb-6"
        >
          <Link
            to="/"
            className="inline-flex items-center gap-2 text-gray-600 hover:text-gray-800 transition-colors duration-200 font-medium group"
          >
            <FaArrowLeft className="group-hover:-translate-x-1 transition-transform duration-200" />
            Back to Login
          </Link>
        </motion.div>

        <motion.div
          variants={containerVariants}
          initial="hidden"
          animate="visible"
          className="bg-white/80 backdrop-blur-lg rounded-3xl shadow-2xl p-8 border border-white/20"
        >
          {/* Header */}
          <motion.div
            variants={itemVariants}
            className="text-center mb-8"
          >
            <div className="w-20 h-20 bg-gradient-to-r from-blue-500 to-purple-600 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg">
              <FaRocket className="text-3xl text-white" />
            </div>
            <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
              Create Account
            </h1>
            <p className="text-gray-600 mt-2">
              Join us and start your journey
            </p>
          </motion.div>

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Name Field */}
            <motion.div variants={itemVariants}>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Full Name
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <FaUser className="text-gray-400" />
                </div>
                <input
                  type="text"
                  name="name"
                  value={form.name}
                  onChange={handleChange}
                  required
                  className={`w-full pl-10 pr-4 py-3 bg-white border ${
                    formErrors.name ? 'border-red-300' : 'border-gray-200'
                  } rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-300 placeholder-gray-400`}
                  placeholder="Enter your full name"
                />
              </div>
              {formErrors.name && (
                <motion.p
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="text-red-500 text-sm mt-1 flex items-center gap-1"
                >
                  <FaExclamationTriangle className="text-xs" />
                  {formErrors.name}
                </motion.p>
              )}
            </motion.div>

            {/* Email Field */}
            <motion.div variants={itemVariants}>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Email Address
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <FaEnvelope className="text-gray-400" />
                </div>
                <input
                  type="email"
                  name="email"
                  value={form.email}
                  onChange={handleChange}
                  required
                  className={`w-full pl-10 pr-4 py-3 bg-white border ${
                    formErrors.email ? 'border-red-300' : 'border-gray-200'
                  } rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-300 placeholder-gray-400`}
                  placeholder="Enter your email"
                />
              </div>
              {formErrors.email && (
                <motion.p
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="text-red-500 text-sm mt-1 flex items-center gap-1"
                >
                  <FaExclamationTriangle className="text-xs" />
                  {formErrors.email}
                </motion.p>
              )}
            </motion.div>

            {/* Password Field */}
            <motion.div variants={itemVariants}>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Password
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <FaLock className="text-gray-400" />
                </div>
                <input
                  type={showPassword ? "text" : "password"}
                  name="password"
                  value={form.password}
                  onChange={handleChange}
                  required
                  className={`w-full pl-10 pr-12 py-3 bg-white border ${
                    formErrors.password ? 'border-red-300' : 'border-gray-200'
                  } rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-300 placeholder-gray-400`}
                  placeholder="Create a password"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600 transition-colors duration-200"
                >
                  {showPassword ? <FaEyeSlash /> : <FaEye />}
                </button>
              </div>
              {formErrors.password && (
                <motion.p
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="text-red-500 text-sm mt-1 flex items-center gap-1"
                >
                  <FaExclamationTriangle className="text-xs" />
                  {formErrors.password}
                </motion.p>
              )}
            </motion.div>

            {/* Role Field - Commented out as per your request */}
            {/* <motion.div variants={itemVariants}>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Role
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <FaUserShield className="text-gray-400" />
                </div>
                <select
                  name="role"
                  value={form.role}
                  onChange={handleChange}
                  className="w-full pl-10 pr-4 py-3 bg-white border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-300 appearance-none"
                >
                  <option value="cashier">Cashier</option>
                  <option value="manager">Manager</option>
                  <option value="admin">Admin</option>
                </select>
                <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                  <div className="w-2 h-2 border-r-2 border-b-2 border-gray-400 transform rotate-45"></div>
                </div>
              </div>
            </motion.div> */}

            {/* Submit Button */}
            <motion.button
              variants={itemVariants}
              type="submit"
              disabled={loading}
              whileHover={{ scale: loading ? 1 : 1.02 }}
              whileTap={{ scale: 0.98 }}
              className="w-full bg-gradient-to-r from-blue-500 to-purple-600 text-white py-4 rounded-xl font-semibold shadow-lg hover:shadow-xl transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {loading ? (
                <>
                  <motion.div
                    animate={{ rotate: 360 }}
                    transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                    className="w-5 h-5 border-2 border-white border-t-transparent rounded-full"
                  />
                  Creating Account...
                </>
              ) : (
                <>
                  <FaCheckCircle />
                  Create Account
                </>
              )}
            </motion.button>
          </form>

          {/* Login Link */}
          <motion.div
            variants={itemVariants}
            className="text-center mt-6 pt-6 border-t border-gray-200"
          >
            <p className="text-gray-600">
              Already have an account?{" "}
              <Link
                to="/"
                className="text-blue-600 hover:text-blue-700 font-semibold transition-colors duration-200 hover:underline"
              >
                Sign In
              </Link>
            </p>
          </motion.div>
        </motion.div>

        {/* Feature Highlights - Commented out as per your request */}
        {/* <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
          className="grid grid-cols-1 sm:grid-cols-3 gap-4 mt-8"
        >
          <div className="text-center p-4 bg-white/50 backdrop-blur-sm rounded-xl shadow-lg border border-white/20">
            <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center mx-auto mb-2">
              <FaUserShield className="text-blue-600" />
            </div>
            <p className="text-sm font-medium text-gray-700">Secure</p>
            <p className="text-xs text-gray-500">Bank-level security</p>
          </div>
          <div className="text-center p-4 bg-white/50 backdrop-blur-sm rounded-xl shadow-lg border border-white/20">
            <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center mx-auto mb-2">
              <FaRocket className="text-green-600" />
            </div>
            <p className="text-sm font-medium text-gray-700">Fast</p>
            <p className="text-xs text-gray-500">Instant setup</p>
          </div>
          <div className="text-center p-4 bg-white/50 backdrop-blur-sm rounded-xl shadow-lg border border-white/20">
            <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center mx-auto mb-2">
              <FaCheckCircle className="text-purple-600" />
            </div>
            <p className="text-sm font-medium text-gray-700">Reliable</p>
            <p className="text-xs text-gray-500">99.9% uptime</p>
          </div>
        </motion.div> */}
      </motion.div>
    </div>
  );
};

export default Register;