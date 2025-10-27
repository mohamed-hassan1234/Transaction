// controllers/dashboardController.js
import Client from "../models/Client.js";
import Guarantor from "../models/Guarantor.js";
import TaxLog from "../models/TaxLog.js";

export const getDashboardStats = async (req, res) => {
  try {
    // Total clients
    const totalClients = await Client.countDocuments();

    // Total guarantors
    const totalGuarantors = await Guarantor.countDocuments();

    // Total balance (sum of all client balances)
    const totalBalanceResult = await Client.aggregate([
      { $group: { _id: null, total: { $sum: "$balance" } } }
    ]);
    const totalBalance = totalBalanceResult[0]?.total || 0;

    // Total profit from TaxLog
    const totalProfitResult = await TaxLog.aggregate([
      { $group: { _id: null, total: { $sum: "$profit" } } }
    ]);
    const totalProfit = totalProfitResult[0]?.total || 0;

    // Send data to frontend
    res.status(200).json({
      totalClients,
      totalGuarantors,
      totalBalance,
      totalProfit
    });
  } catch (error) {
    console.error("Dashboard Error:", error);
    res.status(500).json({ message: "Server Error", error: error.message });
  }
};
