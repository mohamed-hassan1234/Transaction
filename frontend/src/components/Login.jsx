import React, { useState } from "react";
import axios from "axios";
import { Link, useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { 
  FaEnvelope, 
  FaLock, 
  FaEye, 
  FaEyeSlash,
  FaSignInAlt,
  FaUser,
  FaShieldAlt,
  FaRocket,
  FaCheckCircle,
  FaExclamationTriangle
} from "react-icons/fa";
import Swal from 'sweetalert2';

const Login = () => {
  const [form, setForm] = useState({ email: "", password: "" });
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [formErrors, setFormErrors] = useState({});
  const navigate = useNavigate();

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
    
    if (!form.email.trim()) {
      errors.email = "Email is required";
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) {
      errors.email = "Please enter a valid email address";
    }
    
    if (!form.password) {
      errors.password = "Password is required";
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
      const res = await axios.post("/api/auth/login", form, {
        withCredentials: true,
      });

      const { token, user } = res.data;

      // Save JWT to localStorage
      localStorage.setItem("token", token);
      localStorage.setItem("user", JSON.stringify(user));

      // Show beautiful success alert
      await Swal.fire({
        title: '🎉 Welcome Back!',
        text: `Welcome back, ${user.name}!`,
        icon: 'success',
        background: '#f0fdf4',
        color: '#065f46',
        confirmButtonText: 'Go to Dashboard',
        confirmButtonColor: '#10b981',
        iconColor: '#10b981',
        customClass: {
          popup: 'rounded-2xl shadow-2xl',
          title: 'text-2xl font-bold',
          confirmButton: 'px-6 py-2 rounded-lg font-semibold'
        }
      });

      setForm({ email: "", password: "" });
      setFormErrors({});
      
      // Navigate to dashboard
      navigate("/dashboard");

    } catch (err) {
      const errorMsg = err.response?.data?.message || err.message || "Login failed";
      
      // Show beautiful error alert
      await Swal.fire({
        title: '❌ Login Failed',
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
              <FaSignInAlt className="text-3xl text-white" />
            </div>
            <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
              Welcome Back
            </h1>
            <p className="text-gray-600 mt-2">
              Sign in to your account
            </p>
          </motion.div>

          <form onSubmit={handleSubmit} className="space-y-6">
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
                  placeholder="Enter your password"
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

            {/* Remember Me & Forgot Password */}
            <motion.div 
              variants={itemVariants}
              className="flex items-center justify-between"
            >
              {/* <label className="flex items-center">
                <input
                  type="checkbox"
                  className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500 focus:ring-2"
                />
                <span className="ml-2 text-sm text-gray-600">Remember me</span>
              </label> */}
              {/* <a
                href="/forgot-password"
                className="text-sm text-blue-600 hover:text-blue-700 font-medium transition-colors duration-200 hover:underline"
              >
                Forgot password?
              </a> */}
            </motion.div>

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
                  Signing In...
                </>
              ) : (
                <>
                  <FaSignInAlt />
                  Sign In
                </>
              )}
            </motion.button>
          </form>

          {/* Register Link */}
          <motion.div
            variants={itemVariants}
            className="text-center mt-6 pt-6 border-t border-gray-200"
          >
            <p className="text-gray-600">
              Don't have an account?{" "}
              <Link
                to="/register"
                className="text-blue-600 hover:text-blue-700 font-semibold transition-colors duration-200 hover:underline"
              >
                Create Account
              </Link>
            </p>
          </motion.div>
        </motion.div>

        {/* Feature Highlights */}
        {/* <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
          className="grid grid-cols-1 sm:grid-cols-3 gap-4 mt-8"
        >
          <div className="text-center p-4 bg-white/50 backdrop-blur-sm rounded-xl shadow-lg border border-white/20">
            <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center mx-auto mb-2">
              <FaShieldAlt className="text-blue-600" />
            </div>
            <p className="text-sm font-medium text-gray-700">Secure</p>
            <p className="text-xs text-gray-500">Bank-level security</p>
          </div>
          <div className="text-center p-4 bg-white/50 backdrop-blur-sm rounded-xl shadow-lg border border-white/20">
            <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center mx-auto mb-2">
              <FaRocket className="text-green-600" />
            </div>
            <p className="text-sm font-medium text-gray-700">Fast</p>
            <p className="text-xs text-gray-500">Lightning quick</p>
          </div>
          <div className="text-center p-4 bg-white/50 backdrop-blur-sm rounded-xl shadow-lg border border-white/20">
            <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center mx-auto mb-2">
              <FaUser className="text-purple-600" />
            </div>
            <p className="text-sm font-medium text-gray-700">Simple</p>
            <p className="text-xs text-gray-500">Easy to use</p>
          </div>
        </motion.div> */}
      </motion.div>
    </div>
  );
};

export default Login;