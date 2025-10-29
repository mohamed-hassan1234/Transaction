import React, { useState, useEffect } from "react";
import axios from "axios";
import { motion, AnimatePresence } from "framer-motion";
import { 
  FaCog, 
  FaSave, 
  FaSync, 
  FaPercentage, 
  FaSlidersH, 
  FaShieldAlt,
  FaBell,
  FaPalette,
  FaDatabase,
  FaUserCog,
  FaLock,
  FaGlobe,
  FaMobileAlt,
  FaDesktop,
  FaCheckCircle,
  FaExclamationTriangle
} from "react-icons/fa";

const Setting = () => {
  const [settings, setSettings] = useState({});
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState({});
  const [message, setMessage] = useState("");
  const [activeCategory, setActiveCategory] = useState("financial");
  const token = localStorage.getItem("token");

  // Enhanced settings structure with categories and metadata
  const settingCategories = {
    financial: {
      title: "Financial Settings",
      icon: <FaPercentage className="text-green-500" />,
      description: "Manage tax rates and financial configurations",
      settings: [
        {
          key: "taxRate",
          label: "Tax Rate",
          type: "decimal",
          icon: <FaPercentage className="text-blue-500" />,
          description: "Set the default tax rate for all transactions (e.g., 0.05 for 5%)",
          min: 0,
          max: 1,
          step: 0.001,
          placeholder: "0.05"
        },
        // {
        //   key: "withdraw_tax",
        //   label: "Withdraw Tax Rate",
        //   type: "decimal",
        //   icon: <FaPercentage className="text-red-500" />,
        //   description: "Tax rate for withdrawal transactions (e.g., 0.03 for 3%)",
        //   min: 0,
        //   max: 1,
        //   step: 0.001,
        //   placeholder: "0.03"
        // }
      ]
    },
    // general: {
    //   title: "General Settings",
    //   icon: <FaSlidersH className="text-purple-500" />,
    //   description: "Basic application configurations",
    //   settings: [
    //     {
    //       key: "companyName",
    //       label: "Company Name",
    //       type: "text",
    //       icon: <FaUserCog className="text-indigo-500" />,
    //       description: "Your company or organization name",
    //       placeholder: "Enter company name"
    //     },
    //     {
    //       key: "defaultCurrency",
    //       label: "Default Currency",
    //       type: "select",
    //       icon: <FaGlobe className="text-green-500" />,
    //       description: "Primary currency for all transactions",
    //       options: ["USD", "EUR", "GBP", "JPY", "CAD", "AUD"]
    //     }
    //   ]
    // },
    // security: {
    //   title: "Security",
    //   icon: <FaShieldAlt className="text-red-500" />,
    //   description: "Security and access control settings",
    //   settings: [
    //     {
    //       key: "sessionTimeout",
    //       label: "Session Timeout",
    //       type: "number",
    //       icon: <FaLock className="text-orange-500" />,
    //       description: "Auto logout after inactivity (minutes)",
    //       min: 5,
    //       max: 480,
    //       placeholder: "30"
    //     }
    //   ]
    // },
    // notifications: {
    //   title: "Notifications",
    //   icon: <FaBell className="text-yellow-500" />,
    //   description: "Configure alerts and notifications",
    //   settings: [
    //     {
    //       key: "emailNotifications",
    //       label: "Email Notifications",
    //       type: "toggle",
    //       icon: <FaBell className="text-blue-500" />,
    //       description: "Receive email alerts for important events"
    //     }
    //   ]
    // },
    // appearance: {
    //   title: "Appearance",
    //   icon: <FaPalette className="text-pink-500" />,
    //   description: "Customize the look and feel",
    //   settings: [
    //     {
    //       key: "theme",
    //       label: "Theme",
    //       type: "select",
    //       icon: <FaPalette className="text-purple-500" />,
    //       description: "Choose your preferred theme",
    //       options: ["Light", "Dark", "Auto"]
    //     }
    //   ]
    // }
  };

  // Fetch all settings
  const fetchSettings = async () => {
    setLoading(true);
    try {
      const allSettings = {};
      const allKeys = Object.values(settingCategories).flatMap(category => 
        category.settings.map(setting => setting.key)
      );

      for (const key of allKeys) {
        try {
          const res = await axios.get(`/api/settings/${key}`, {
            headers: { Authorization: `Bearer ${token}` },
          });
          // Convert string values to appropriate types
          const value = res.data.value;
          const settingConfig = Object.values(settingCategories)
            .flatMap(cat => cat.settings)
            .find(s => s.key === key);
          
          if (settingConfig?.type === "decimal") {
            allSettings[key] = parseFloat(value) || 0;
          } else if (settingConfig?.type === "number") {
            allSettings[key] = parseInt(value) || 0;
          } else if (settingConfig?.type === "toggle") {
            allSettings[key] = value === "true" || value === true;
          } else {
            allSettings[key] = value || "";
          }
        } catch (err) {
          if (err.response?.status === 404) {
            // Set default values for missing settings
            const settingConfig = Object.values(settingCategories)
              .flatMap(cat => cat.settings)
              .find(s => s.key === key);
            
            if (settingConfig) {
              allSettings[key] = settingConfig.type === "toggle" ? false : 
                               settingConfig.type === "decimal" ? 0 : 
                               settingConfig.type === "number" ? 0 : "";
            } else {
              allSettings[key] = "";
            }
          } else {
            console.error(`Failed to fetch setting ${key}:`, err);
          }
        }
      }
      setSettings(allSettings);
    } catch (err) {
      console.error("Failed to fetch settings", err);
      setMessage({
        type: "error",
        text: "❌ Failed to fetch settings"
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSettings();
  }, []);

  const handleChange = (key, value) => {
    setSettings(prev => ({ ...prev, [key]: value }));
  };

  const handleSave = async (key) => {
    setSaving(prev => ({ ...prev, [key]: true }));
    setMessage({ type: "", text: "" });
    
    try {
      // Convert value to string for storage
      const valueToSave = settings[key]?.toString() || "";
      
      await axios.put(
        `/api/settings/${key}`,
        { value: valueToSave },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      
      setMessage({
        type: "success",
        text: `✅ "${getSettingLabel(key)}" updated successfully!`
      });
      
      // Clear message after 3 seconds
      setTimeout(() => {
        setMessage({ type: "", text: "" });
      }, 3000);
    } catch (err) {
      console.error(err);
      const errorMsg = err.response?.data?.message || "Failed to update setting";
      setMessage({
        type: "error",
        text: `❌ ${errorMsg}`
      });
    } finally {
      setSaving(prev => ({ ...prev, [key]: false }));
    }
  };

  const getSettingLabel = (key) => {
    const setting = Object.values(settingCategories)
      .flatMap(cat => cat.settings)
      .find(s => s.key === key);
    return setting?.label || key;
  };

  const formatDecimalDisplay = (value, setting) => {
    if (setting.type === "decimal" && value !== "" && value !== null && value !== undefined) {
      return `(${(parseFloat(value) * 100).toFixed(1)}%)`;
    }
    return "";
  };

  const renderSettingInput = (setting) => {
    const value = settings[setting.key] || "";

    switch (setting.type) {
      case "decimal":
        return (
          <div className="relative flex-1">
            <input
              type="number"
              value={value}
              onChange={(e) => {
                const inputValue = e.target.value;
                // Allow empty input or valid decimal numbers
                if (inputValue === "" || /^-?\d*\.?\d*$/.test(inputValue)) {
                  handleChange(setting.key, inputValue === "" ? "" : parseFloat(inputValue));
                }
              }}
              min={setting.min}
              max={setting.max}
              step={setting.step || 0.001}
              className="w-full pl-4 pr-20 py-3 bg-white border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-300"
              placeholder={setting.placeholder}
            />
            <div className="absolute right-4 top-1/2 transform -translate-y-1/2 text-sm text-gray-500 bg-gray-100 px-2 py-1 rounded">
              {formatDecimalDisplay(value, setting) || "0.000"}
            </div>
          </div>
        );

      case "percentage":
        return (
          <div className="relative flex-1">
            <input
              type="number"
              value={value}
              onChange={(e) => handleChange(setting.key, parseFloat(e.target.value) || 0)}
              min={setting.min}
              max={setting.max}
              step={setting.step}
              className="w-full pl-12 pr-4 py-3 bg-white border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-300"
              placeholder={setting.placeholder}
            />
            <div className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400">
              %
            </div>
          </div>
        );

      case "toggle":
        return (
          <div className="flex-1">
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={!!value}
                onChange={(e) => handleChange(setting.key, e.target.checked)}
                className="sr-only peer"
              />
              <div className="w-14 h-7 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-0.5 after:left-[4px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-6 after:w-6 after:transition-all peer-checked:bg-blue-600"></div>
              <span className="ml-3 text-sm font-medium text-gray-700">
                {value ? "Enabled" : "Disabled"}
              </span>
            </label>
          </div>
        );

      case "select":
        return (
          <select
            value={value}
            onChange={(e) => handleChange(setting.key, e.target.value)}
            className="w-full px-4 py-3 bg-white border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-300"
          >
            <option value="">Select {setting.label}</option>
            {setting.options?.map(option => (
              <option key={option} value={option}>{option}</option>
            ))}
          </select>
        );

      case "number":
        return (
          <input
            type="number"
            value={value}
            onChange={(e) => handleChange(setting.key, parseInt(e.target.value) || 0)}
            min={setting.min}
            max={setting.max}
            className="w-full px-4 py-3 bg-white border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-300"
            placeholder={setting.placeholder}
          />
        );

      default:
        return (
          <input
            type="text"
            value={value}
            onChange={(e) => handleChange(setting.key, e.target.value)}
            className="w-full px-4 py-3 bg-white border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-300"
            placeholder={setting.placeholder}
          />
        );
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

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-purple-50 flex items-center justify-center">
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
          className="w-16 h-16 border-4 border-indigo-500 border-t-transparent rounded-full"
        />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-purple-50 p-3 sm:p-4 lg:p-6">
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="max-w-7xl mx-auto"
      >
        {/* Header Section */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-6 lg:mb-8"
        >
          <h1 className="text-3xl lg:text-5xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent mb-3 lg:mb-4">
            System Settings
          </h1>
          <p className="text-base lg:text-xl text-gray-600 max-w-2xl mx-auto px-4">
            Customize your application experience with powerful configuration options and preferences.
          </p>
        </motion.div>

        {/* Message Alert */}
        <AnimatePresence>
          {message.text && (
            <motion.div
              initial={{ opacity: 0, y: -10, scale: 0.9 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -10, scale: 0.9 }}
              className={`mb-6 p-4 rounded-2xl text-center font-semibold shadow-lg ${
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

        <div className="flex flex-col lg:flex-row gap-6 lg:gap-8">
          {/* Sidebar Navigation */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.2 }}
            className="lg:w-80 flex-shrink-0"
          >
            <div className="bg-white/80 backdrop-blur-lg rounded-2xl shadow-xl p-6 border border-white/20">
              <h3 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-3">
                <FaCog className="text-indigo-500" />
                Categories
              </h3>
              
              <nav className="space-y-2">
                {Object.entries(settingCategories).map(([key, category]) => (
                  <motion.button
                    key={key}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => setActiveCategory(key)}
                    className={`w-full text-left p-3 rounded-xl transition-all duration-300 flex items-center gap-3 ${
                      activeCategory === key
                        ? "bg-gradient-to-r from-indigo-500 to-purple-500 text-white shadow-lg"
                        : "bg-gray-50 text-gray-700 hover:bg-gray-100"
                    }`}
                  >
                    <div className="text-lg">
                      {category.icon}
                    </div>
                    <div className="flex-1">
                      <p className="font-semibold text-sm">{category.title}</p>
                      <p className="text-xs opacity-75">
                        {category.settings.length} setting{category.settings.length !== 1 ? 's' : ''}
                      </p>
                    </div>
                  </motion.button>
                ))}
              </nav>

              {/* Refresh Button */}
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={fetchSettings}
                className="w-full mt-6 flex items-center justify-center gap-2 px-4 py-3 bg-gradient-to-r from-gray-600 to-gray-700 text-white rounded-xl shadow-lg hover:shadow-xl transition-all duration-300"
              >
                <FaSync />
                Refresh Settings
              </motion.button>
            </div>
          </motion.div>

          {/* Main Content */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.3 }}
            className="flex-1"
          >
            <div className="bg-white/80 backdrop-blur-lg rounded-2xl shadow-xl p-6 border border-white/20">
              {/* Category Header */}
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className="flex items-center gap-4 mb-6 pb-4 border-b border-gray-200"
              >
                <div className="text-3xl text-indigo-500">
                  {settingCategories[activeCategory]?.icon}
                </div>
                <div>
                  <h2 className="text-2xl font-bold text-gray-800">
                    {settingCategories[activeCategory]?.title}
                  </h2>
                  <p className="text-gray-600">
                    {settingCategories[activeCategory]?.description}
                  </p>
                </div>
              </motion.div>

              {/* Settings Grid */}
              <motion.div
                variants={containerVariants}
                initial="hidden"
                animate="visible"
                className="space-y-6"
              >
                {settingCategories[activeCategory]?.settings.map((setting) => {
                  const currentValue = settings[setting.key] || "";
                  
                  return (
                    <motion.div
                      key={setting.key}
                      variants={itemVariants}
                      whileHover="hover"
                      variants={cardVariants}
                      className="bg-gradient-to-br from-white to-gray-50 rounded-2xl shadow-lg p-6 border border-gray-100"
                    >
                      <div className="flex flex-col lg:flex-row lg:items-center gap-4">
                        {/* Setting Icon and Info */}
                        <div className="flex items-start gap-4 flex-1">
                          <div className="w-12 h-12 bg-gradient-to-r from-indigo-500 to-purple-500 rounded-xl flex items-center justify-center text-white text-lg">
                            {setting.icon}
                          </div>
                          <div className="flex-1">
                            <h3 className="font-bold text-gray-800 text-lg">
                              {setting.label}
                            </h3>
                            <p className="text-gray-600 text-sm mt-1">
                              {setting.description}
                            </p>
                            {setting.type === "decimal" && (
                              <p className="text-xs text-blue-600 mt-1">
                                💡 Enter decimal values like 0.05 for 5%, 0.003 for 0.3%
                              </p>
                            )}
                          </div>
                        </div>

                        {/* Input and Save Button */}
                        <div className="flex flex-col sm:flex-row gap-3 lg:w-96">
                          {renderSettingInput(setting)}
                          
                          <motion.button
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                            onClick={() => handleSave(setting.key)}
                            disabled={saving[setting.key]}
                            className="flex items-center justify-center gap-2 px-6 py-3 bg-gradient-to-r from-indigo-500 to-purple-600 text-white rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed min-w-[120px]"
                          >
                            {saving[setting.key] ? (
                              <motion.div
                                animate={{ rotate: 360 }}
                                transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                                className="w-4 h-4 border-2 border-white border-t-transparent rounded-full"
                              />
                            ) : (
                              <FaSave />
                            )}
                            {saving[setting.key] ? "Saving..." : "Save"}
                          </motion.button>
                        </div>
                      </div>

                      {/* Current Value Display - FIXED: using currentValue variable */}
                      <div className="mt-4 p-3 bg-blue-50 rounded-lg border border-blue-200">
                        <p className="text-sm text-blue-700 font-medium">
                          Current Value:{" "}
                          <span className="font-bold">
                            {setting.type === "decimal" && currentValue !== "" 
                              ? `${currentValue} ${formatDecimalDisplay(currentValue, setting)}`
                              : currentValue?.toString() || "Not set"
                            }
                          </span>
                        </p>
                      </div>
                    </motion.div>
                  );
                })}

                {/* Empty State */}
                {settingCategories[activeCategory]?.settings.length === 0 && (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="text-center py-12"
                  >
                    <div className="w-24 h-24 bg-gradient-to-r from-gray-200 to-gray-300 rounded-full flex items-center justify-center mx-auto mb-4">
                      <FaSlidersH className="text-3xl text-gray-400" />
                    </div>
                    <h4 className="text-xl font-semibold text-gray-500 mb-2">No Settings Available</h4>
                    <p className="text-gray-400">There are no settings configured for this category.</p>
                  </motion.div>
                )}
              </motion.div>
            </div>
          </motion.div>
        </div>

        {/* Quick Stats Footer */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="mt-8 grid grid-cols-1 sm:grid-cols-3 gap-4"
        >
          {/* <div className="bg-white/80 backdrop-blur-lg rounded-2xl shadow-lg p-4 text-center border border-white/20">
            <FaDatabase className="text-2xl text-indigo-500 mx-auto mb-2" />
            <p className="text-sm text-gray-600">Total Settings</p>
            <p className="text-xl font-bold text-gray-800">
              {Object.values(settingCategories).reduce((total, cat) => total + cat.settings.length, 0)}
            </p>
          </div>
          <div className="bg-white/80 backdrop-blur-lg rounded-2xl shadow-lg p-4 text-center border border-white/20">
            <FaMobileAlt className="text-2xl text-green-500 mx-auto mb-2" />
            <p className="text-sm text-gray-600">Mobile Optimized</p>
            <p className="text-xl font-bold text-gray-800">100%</p>
          </div>
          <div className="bg-white/80 backdrop-blur-lg rounded-2xl shadow-lg p-4 text-center border border-white/20">
            <FaDesktop className="text-2xl text-purple-500 mx-auto mb-2" />
            <p className="text-sm text-gray-600">Responsive Design</p>
            <p className="text-xl font-bold text-gray-800">Perfect</p>
          </div> */}
        </motion.div>
      </motion.div>

      {/* Background Decorations */}
      <div className="fixed inset-0 -z-10 overflow-hidden">
        <div className="absolute -top-40 -right-40 w-60 h-60 lg:w-80 lg:h-80 bg-indigo-200 rounded-full blur-3xl opacity-30 animate-pulse"></div>
        <div className="absolute -bottom-40 -left-40 w-60 h-60 lg:w-80 lg:h-80 bg-purple-200 rounded-full blur-3xl opacity-30 animate-pulse delay-1000"></div>
      </div>
    </div>
  );
};

export default Setting;