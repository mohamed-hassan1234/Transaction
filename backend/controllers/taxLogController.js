import TaxLog from "../models/TaxLog.js";
import Client from "../models/Client.js";
import Transaction from "../models/Transaction.js";

// 🧾 Record tax info when transaction is created
export const recordTaxFromTransaction = async (transaction) => {
  try {
    const sender = transaction.senderClient || null;
    const receiver = transaction.receiverClient || null;

    // compute profit or tax amount
    const profit = transaction.taxAmount || 0;

    const newLog = new TaxLog({
      senderClient: sender,
      receiverClient: receiver,
      transactionId: transaction._id,
      amountSent: transaction.amount,
      amountReceived: transaction.totalAmount - transaction.taxAmount,
      profit,
      method: transaction.type === "debit" ? "Send" : "Receive",
      profitSource: "Transfer Fee",
      description: `Tax recorded for transaction ${transaction.receiptNumber || "N/A"}`,
      date: new Date(),
    });

    await newLog.save();
    console.log("✅ Tax log created for transaction:", transaction._id);
  } catch (error) {
    console.error("❌ Failed to record tax:", error.message);
  }
};

// 🧾 Fetch all tax logs (for dashboard view)
export const getAllTaxLogs = async (req, res) => {
  try {
    const logs = await TaxLog.find()
      .populate("senderClient", "name phone")
      .populate("receiverClient", "name phone")
      .populate("transactionId", "receiptNumber totalAmount date")
      .sort({ date: -1 });

    res.json(logs);
  } catch (error) {
    res.status(500).json({ message: "Failed to fetch tax logs", error: error.message });
  }
};
