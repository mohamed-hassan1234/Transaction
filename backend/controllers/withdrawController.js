import Withdraw from "../models/Withdraw.js";
import Client from "../models/Client.js";
import AuditLog from "../models/AuditLog.js";
import Settings from "../models/Settings.js";

export const createWithdraw = async (req, res) => {
  try {
    const { clientId, amount, notes, date } = req.body;

    // ✅ Validation
    if (!clientId || !amount || amount <= 0) {
      return res.status(400).json({ message: "Invalid input: clientId and positive amount required" });
    }

    // ✅ Find client
    const client = await Client.findById(clientId);
    if (!client) {
      return res.status(404).json({ message: "Client not found" });
    }

    // ✅ Get tax setting (SAME AS TRANSACTION)
    const taxSetting = await Settings.findOne({ key: "taxRate" });
    const taxRate = taxSetting ? Number(taxSetting.value) : 0;

    // ✅ Calculate tax and amounts (EXACTLY LIKE TRANSACTION)
    const amt = Number(amount);
    const taxAmount = amt * taxRate; // Same calculation as transaction
    const totalReceived = amt - taxAmount; // What client actually receives
    const totalDeduction = amt; // Full amount deducted from balance

    // ✅ Check client balance
    if (client.balance < totalDeduction) {
      return res.status(400).json({
        message: `Insufficient balance. Required: $${totalDeduction.toFixed(2)}, Available: $${client.balance.toFixed(2)}`,
      });
    }

    // ✅ Update client balance (deduct full amount)
    client.balance -= totalDeduction;
    await client.save();

    // ✅ Create withdraw record
    const withdraw = new Withdraw({
      client: clientId,
      amount: amt,
      taxRate,
      taxAmount,
      totalReceived, // This is what client actually gets
      notes: notes || "",
      date: date ? new Date(date) : new Date(),
      createdBy: req.user._id,
      status: "completed",
    });

    await withdraw.save();

    // ✅ Populate for response
    await withdraw.populate("client createdBy");

    // ✅ Audit log
    await AuditLog.create({
      action: "withdraw_money",
      user: req.user._id,
      targetCollection: "Withdraw",
      targetId: withdraw._id,
      ip: req.ip,
      details: { 
        client: client.fullName, 
        amount: amt, 
        taxRate, 
        taxAmount, 
        totalReceived,
        clientBalanceAfter: client.balance
      },
    });

    res.status(201).json({
      message: "✅ Withdraw successful with tax deducted",
      withdraw: {
        ...withdraw.toObject(),
        clientReceives: totalReceived // Additional field for frontend
      },
    });

  } catch (err) {
    console.error("Withdraw error:", err);
    res.status(500).json({ 
      message: "Withdraw failed", 
      error: err.message 
    });
  }
};

export const getWithdraws = async (req, res) => {
  try {
    const { start, end, clientId, search } = req.query;
    const query = {};

    // Date range filter
    if (start || end) {
      query.date = {};
      if (start) query.date.$gte = new Date(start);
      if (end) query.date.$lte = new Date(end + "T23:59:59.999Z");
    }

    // Client filter
    if (clientId) {
      query.client = clientId;
    }

    // Search filter
    if (search) {
      query.$or = [
        { notes: { $regex: search, $options: "i" } },
        { "client.fullName": { $regex: search, $options: "i" } }
      ];
    }

    const withdraws = await Withdraw.find(query)
      .populate("client", "fullName balance phone")
      .populate("createdBy", "name email")
      .sort({ date: -1, createdAt: -1 })
      .limit(1000);

    res.json(withdraws);

  } catch (err) {
    console.error("Get withdraws error:", err);
    res.status(500).json({
      message: "Failed to fetch withdraws",
      error: err.message,
    });
  }
};

export const getWithdraw = async (req, res) => {
  try {
    const withdraw = await Withdraw.findById(req.params.id)
      .populate("client", "fullName balance phone email")
      .populate("createdBy", "name email");

    if (!withdraw) {
      return res.status(404).json({ message: "Withdraw not found" });
    }

    res.json(withdraw);

  } catch (err) {
    console.error("Get withdraw error:", err);
    res.status(500).json({ 
      message: "Failed to fetch withdraw", 
      error: err.message 
    });
  }
};

export const getWithdrawStats = async (req, res) => {
  try {
    const { start, end } = req.query;
    const matchStage = {};

    if (start || end) {
      matchStage.date = {};
      if (start) matchStage.date.$gte = new Date(start);
      if (end) matchStage.date.$lte = new Date(end + "T23:59:59.999Z");
    }

    const stats = await Withdraw.aggregate([
      { $match: matchStage },
      {
        $group: {
          _id: null,
          totalAmount: { $sum: "$amount" },
          totalTax: { $sum: "$taxAmount" },
          totalReceived: { $sum: "$totalReceived" },
          count: { $sum: 1 }
        }
      }
    ]);

    const result = stats[0] || {
      totalAmount: 0,
      totalTax: 0,
      totalReceived: 0,
      count: 0
    };

    res.json(result);

  } catch (err) {
    console.error("Get withdraw stats error:", err);
    res.status(500).json({
      message: "Failed to fetch withdraw statistics",
      error: err.message,
    });
  }
};