import Transaction from '../models/Transaction.js';
import mongoose from 'mongoose';

export const dailyReport = async (req, res) => {
  const { date } = req.query;
  if (!date) return res.status(400).json({ message: 'date=YYYY-MM-DD required' });

  const start = new Date(date);
  start.setHours(0,0,0,0);
  const end = new Date(date);
  end.setHours(23,59,59,999);

  const agg = await Transaction.aggregate([
    { $match: { date: { $gte: start, $lte: end }, status: 'completed' } },
    { $group: {
        _id: "$type",
        totalAmount: { $sum: "$totalAmount" },
        count: { $sum: 1 }
    }},
    { $project: { type: "$_id", totalAmount: 1, count: 1, _id: 0 } }
  ]);

  // combine into friendly object
  const summary = { date, byType: {}, total: 0, count: 0 };
  agg.forEach(a => {
    summary.byType[a.type] = { totalAmount: a.totalAmount, count: a.count };
    summary.total += a.totalAmount;
    summary.count += a.count;
  });

  res.json(summary);
};

export const summaryReport = async (req, res) => {
  const { start, end } = req.query;
  const s = start ? new Date(start) : new Date('1970-01-01');
  const e = end ? new Date(end) : new Date();
  e.setHours(23,59,59,999);

  const agg = await Transaction.aggregate([
    { $match: { date: { $gte: s, $lte: e }, status: 'completed' } },
    { $group: { _id: "$type", totalAmount: { $sum: "$totalAmount" }, count: { $sum: 1 } } }
  ]);
  res.json(agg);
};
