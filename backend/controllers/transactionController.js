import Transaction from "../models/Transaction.js";
import Client from "../models/Client.js";
import AuditLog from "../models/AuditLog.js";
import Settings from "../models/Settings.js";
import { generateReceiptNumber } from "../utils/receipt.js";
import { recordTaxFromTransaction } from "../controllers/taxLogController.js"; // 🆕 Import automatic tax logger

export const createTransaction = async (req, res) => {
  try {
    const { type, amount, senderClient, receiverClient, externalName, notes } = req.body;

    if (!type || !amount || amount <= 0) {
      return res.status(400).json({ message: "Invalid input" });
    }

    // 🧾 Get tax rate
    const taxRateSetting = await Settings.findOne({ key: "taxRate" });
    const taxRate = taxRateSetting ? Number(taxRateSetting.value) : 0;

    const amt = Number(amount);
    const taxAmount = amt * taxRate;
    const totalAmount = amt + taxAmount;
    const receiptNumber = await generateReceiptNumber();

    // ---------------------- 💸 DEBIT TRANSACTION ----------------------
    if (type === "debit") {
      if (!senderClient || !receiverClient) {
        return res.status(400).json({ message: "Sender and Receiver are required for debit" });
      }

      const sender = await Client.findById(senderClient);
      const receiver = await Client.findById(receiverClient);
      if (!sender) return res.status(404).json({ message: "Sender not found" });
      if (!receiver) return res.status(404).json({ message: "Receiver not found" });

      if (sender.balance < totalAmount) {
        return res.status(400).json({ message: "Insufficient balance" });
      }

      // ✅ Create transaction
      const tx = new Transaction({
        type,
        amount: amt,
        taxRate,
        taxAmount,
        totalAmount,
        senderClient,
        receiverClient,
        externalName: externalName || null,
        receiptNumber,
        notes: notes || null,
        createdBy: req.user._id,
      });

      await tx.save();

      // ✅ Update balances
      sender.balance -= totalAmount; // sender loses amount + tax
      receiver.balance += amt; // receiver gets only amount
      await sender.save();
      await receiver.save();

      // 🧾 Record tax automatically
      await recordTaxFromTransaction(tx);

      // ✅ Audit log
      await AuditLog.create({
        action: "create_transaction",
        user: req.user._id,
        targetCollection: "Transaction",
        targetId: tx._id,
        ip: req.ip,
        details: { receiptNumber, type, amount, taxRate, taxAmount },
      });

      return res.status(201).json({
        message: "Debit transaction created successfully",
        transaction: tx,
      });
    }

    // ---------------------- 💰 CREDIT TRANSACTION ----------------------
    if (type === "credit") {
      if (!receiverClient) {
        return res.status(400).json({ message: "Receiver is required for credit" });
      }

      const receiver = await Client.findById(receiverClient);
      if (!receiver) return res.status(404).json({ message: "Receiver not found" });

      // ✅ Create transaction
      const tx = new Transaction({
        type,
        amount: amt,
        taxRate,
        taxAmount,
        totalAmount,
        receiverClient,
        externalName: externalName || null,
        receiptNumber,
        notes: notes || null,
        createdBy: req.user._id,
      });

      await tx.save();

      // ✅ Update balance
      receiver.balance += amt - taxAmount;
      await receiver.save();

      // 🧾 Record tax automatically
      await recordTaxFromTransaction(tx);

      // ✅ Audit log
      await AuditLog.create({
        action: "create_transaction",
        user: req.user._id,
        targetCollection: "Transaction",
        targetId: tx._id,
        ip: req.ip,
        details: { receiptNumber, type, amount, taxRate, taxAmount },
      });

      return res.status(201).json({
        message: "Credit transaction created successfully",
        transaction: tx,
      });
    }

    return res.status(400).json({ message: "Unknown transaction type" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Transaction failed", error: err.message });
  }
};




export const getTransactions = async (req, res) => {
  try {
    const { start, end, type, clientId, status } = req.query;
    const q = {};
    if (start || end) q.date = {};
    if (start) q.date.$gte = new Date(start);
    if (end) q.date.$lte = new Date(end);
    if (type) q.type = type;
    if (status) q.status = status;
    if (clientId) q.$or = [{ senderClient: clientId }, { receiverClient: clientId }];

    const list = await Transaction.find(q)
      .populate('senderClient receiverClient createdBy')
      .sort({ date: -1 })
      .limit(1000);

    res.json(list);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Failed to fetch transactions', error: err.message });
  }
};

export const getTransaction = async (req, res) => {
  try {
    const tx = await Transaction.findById(req.params.id)
      .populate('senderClient receiverClient createdBy');
    if (!tx) return res.status(404).json({ message: 'Transaction not found' });
    res.json(tx);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Failed to fetch transaction', error: err.message });
  }
};
