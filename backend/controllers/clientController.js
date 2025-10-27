import Client from '../models/Client.js';
import AuditLog from '../models/AuditLog.js';

// CREATE Client
export const createClient = async (req, res) => {
  try {
    const { fullName, phone, address, nationalId, educationLevel, guarantor, balance } = req.body;

    const client = new Client({
      fullName,
      phone,
      address,
      nationalId,
      educationLevel,
      guarantor,
      balance: balance || 0 // haddii balance la siiyo, isticmaal; haddii kale 0
    });

    await client.save();

    // Audit log
    await AuditLog.create({
      action: 'create_client',
      user: req.user?._id || null,
      targetCollection: 'Client',
      targetId: client._id,
      ip: req.ip,
      details: { fullName, balance }
    });

    res.status(201).json(client);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error while creating client" });
  }
};


// GET All Clients
export const getClients = async (req, res) => {
  try {
    const clients = await Client.find().populate('guarantor');
    res.json(clients);
  } catch (err) {
    res.status(500).json({ message: "Server error while fetching clients" });
  }
};

// GET Client by ID
export const getClient = async (req, res) => {
  try {
    const client = await Client.findById(req.params.id).populate('guarantor');
    if (!client) return res.status(404).json({ message: 'Client not found' });
    res.json(client);
  } catch (err) {
    res.status(500).json({ message: "Server error while fetching client" });
  }
};

// UPDATE Client
export const updateClient = async (req, res) => {
  try {
    const updated = await Client.findByIdAndUpdate(req.params.id, req.body, { new: true });

    await AuditLog.create({
      action: 'update_client',
      user: req.user?._id || null,
      targetCollection: 'Client',
      targetId: updated._id,
      ip: req.ip,
      details: req.body
    });

    res.json(updated);
  } catch (err) {
    res.status(500).json({ message: "Server error while updating client" });
  }
};


// UPDATE Client Balance
export const updateClientBalance = async (req, res) => {
  try {
    const { balance } = req.body;
    if (balance === undefined) return res.status(400).json({ message: "Balance is required" });

    const updated = await Client.findByIdAndUpdate(
      req.params.id,
      { balance },
      { new: true }
    );

    if (!updated) return res.status(404).json({ message: "Client not found" });

    // Audit log
    await AuditLog.create({
      action: 'update_client_balance',
      user: req.user?._id || null,
      targetCollection: 'Client',
      targetId: updated._id,
      ip: req.ip,
      details: { balance }
    });

    res.json(updated);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error while updating balance" });
  }
};
