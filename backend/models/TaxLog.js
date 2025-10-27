import mongoose from 'mongoose';

const taxLogSchema = new mongoose.Schema({
  senderClient: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Client',
    required: false
  },
  receiverClient: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Client',
    required: false
  },
  transactionId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Transaction',
    required: true
  },
  amountSent: { type: Number, required: false },        // lacagta la diray
  amountReceived: { type: Number, required: false },    // lacagta la helay
  profit: { type: Number, required: false },            // faa’iidada ka dhex baxday
  method: { type: String, enum: ["Send", "Receive"], required: false }, // nooca (send/receive)
  profitSource: { type: String, enum: ["Transfer Fee", "Exchange Rate", "Commission"], default: "Transfer Fee" }, // sida faa’iidada ku timid
  description: { type: String },                       // faahfaahin dheeri ah
  date: { type: Date, default: Date.now }              // waqtiga dhacdada
});

export default mongoose.model("TaxLog", taxLogSchema);
