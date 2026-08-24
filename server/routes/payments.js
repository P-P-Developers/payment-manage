const express = require('express');
const router = express.Router();
const Payment = require('../models/Payment');
const Panel = require('../models/Panel');
const Log = require('../models/Log');
const User = require('../models/User');
const { protect, hasPermission, adminOnly } = require('../middleware/auth');
const getClientIp = require('../utils/getClientIp');
const { applyCreditToUnpaidBills } = require('../utils/creditHelper');

// @desc    Get all unpaid or partially paid bills for a specific panel client
// @route   GET /api/payments/unpaid/:panelId
// @access  Private (view_panels permission)
router.get('/unpaid/:panelId', protect, hasPermission('view_panels'), async (req, res) => {
  try {
    const bills = await Payment.find({
      panelId: req.params.panelId,
      billAmount: { $gt: 0 },
      $or: [
        { status: { $in: ['Unpaid', 'Partial'] } },
        { status: { $exists: false } },
        { status: null }
      ]
    }).sort({ timestamp: 1 }).lean();

    res.json({ success: true, bills });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// @desc    Get monthly billing summary
// @route   GET /api/payments/monthly-summary
// @access  Private (view_panels permission)
router.get('/monthly-summary', protect, hasPermission('view_panels'), async (req, res) => {
  try {
    const year = parseInt(req.query.year) || new Date().getFullYear();
    const startDate = new Date(`${year}-01-01T00:00:00.000Z`);
    const endDate = new Date(`${year}-12-31T23:59:59.999Z`);

    const summary = await Payment.aggregate([
      {
        $match: {
          $or: [
            { timestamp: { $gte: startDate, $lte: endDate } },
            { timestamp: { $exists: false }, createdAt: { $gte: startDate, $lte: endDate } },
            { timestamp: null, createdAt: { $gte: startDate, $lte: endDate } }
          ]
        }
      },
      {
        $addFields: {
          computedDate: { $ifNull: ["$timestamp", "$createdAt"] }
        }
      },
      {
        $group: {
          _id: {
            panelId: '$panelId',
            month: { $month: { date: "$computedDate", timezone: "Asia/Kolkata" } }
          },
          totalBill: { $sum: '$billAmount' },
          totalReceived: { $sum: '$amountReceived' },
          totalDiscount: { $sum: { $add: [{ $ifNull: ['$billDiscount', 0] }, { $ifNull: ['$paymentDiscount', 0] }] } },
          transactions: {
            $push: {
              paymentType: '$paymentType',
              billAmount: '$billAmount',
              amountReceived: '$amountReceived',
              billDiscount: '$billDiscount',
              paymentDiscount: '$paymentDiscount',
              paymentMode: '$paymentMode',
              remark: '$remark',
              date: '$computedDate'
            }
          }
        }
      },
      {
        $group: {
          _id: '$_id.panelId',
          months: {
            $push: {
              month: '$_id.month',
              bill: '$totalBill',
              received: '$totalReceived',
              discount: '$totalDiscount',
              transactions: '$transactions'
            }
          }
        }
      }
    ]);

    const allPanels = await Panel.find({}).select('panelName category openingBalance createdAt').lean();
    
    const summaryMap = {};
    summary.forEach(item => {
      if (item._id) {
        summaryMap[item._id.toString()] = item.months;
      }
    });

    const finalData = allPanels.map(panel => ({
      _id: {
        _id: panel._id,
        panelName: panel.panelName,
        category: panel.category,
        openingBalance: panel.openingBalance || 0,
        createdAt: panel.createdAt
      },
      months: summaryMap[panel._id.toString()] || []
    }));

    res.json({ success: true, year, data: finalData });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// @desc    Get all payments (with pagination support)
// @route   GET /api/payments
// @access  Private (view_panels permission)
router.get('/', protect, hasPermission('view_panels'), async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limitQuery = req.query.limit;
    const limit = limitQuery === 'all' ? 0 : (parseInt(limitQuery) || 10);
    const skip = limit === 0 ? 0 : (page - 1) * limit;

    let filterQuery = {};

    // Filter by Panel Category if specified
    let categoryPanelIds = null;
    if (req.query.category && req.query.category !== 'All') {
      const matchedCategoryPanels = await Panel.find({
        category: req.query.category
      }).select('_id');
      categoryPanelIds = matchedCategoryPanels.map(p => p._id);
      filterQuery.panelId = { $in: categoryPanelIds };
    }

    // Filter by Search Query (searches panelName, panelCategory, and paymentType)
    if (req.query.search) {
      const matchedPanels = await Panel.find({
        $or: [
          { panelName: { $regex: req.query.search, $options: 'i' } },
          { category: { $regex: req.query.search, $options: 'i' } }
        ]
      }).select('_id');
      const matchedPanelIds = matchedPanels.map(p => p._id);

      // If category filter is also active, intersect the matched panels
      let finalPanelIds = matchedPanelIds;
      if (categoryPanelIds !== null) {
        finalPanelIds = matchedPanelIds.filter(id => categoryPanelIds.some(cId => cId.toString() === id.toString()));
      }

      // Construct search criteria matching panelName/category OR paymentType
      const searchCriteria = [
        { panelId: { $in: finalPanelIds } },
        { paymentType: { $regex: req.query.search, $options: 'i' } }
      ];

      // If there is category filtering, restrict paymentType matches to the chosen category as well
      if (categoryPanelIds !== null) {
        searchCriteria[1] = {
          paymentType: { $regex: req.query.search, $options: 'i' },
          panelId: { $in: categoryPanelIds }
        };
      }

      filterQuery.$or = searchCriteria;
      delete filterQuery.panelId;
    }

    // Filter by Payment Type
    if (req.query.paymentType && req.query.paymentType !== 'All') {
      filterQuery.paymentType = req.query.paymentType;
    }

    // Filter by Payment Mode
    if (req.query.paymentMode && req.query.paymentMode !== 'All') {
      filterQuery.paymentMode = req.query.paymentMode;
    }

    // Filter by Transaction Category
    if (req.query.transactionType === 'bill') {
      filterQuery.billAmount = { $gt: 0 };
    } else if (req.query.transactionType === 'received') {
      filterQuery.amountReceived = { $gt: 0 };
    }

    // Filter by Date Range
    if (req.query.startDate || req.query.endDate) {
      filterQuery.timestamp = {};
      if (req.query.startDate) {
        const [year, month, day] = req.query.startDate.split('-').map(Number);
        const start = new Date(year, month - 1, day);
        start.setHours(0, 0, 0, 0);
        filterQuery.timestamp.$gte = start;
      }
      if (req.query.endDate) {
        const [year, month, day] = req.query.endDate.split('-').map(Number);
        const end = new Date(year, month - 1, day);
        end.setHours(23, 59, 59, 999);
        filterQuery.timestamp.$lte = end;
      }
    }

    // Filter by Discounts Only
    if (req.query.discountOnly === 'true') {
      const discountCondition = {
        $or: [
          { billDiscount: { $gt: 0 } },
          { paymentDiscount: { $gt: 0 } }
        ]
      };
      
      if (filterQuery.$or) {
        filterQuery.$and = filterQuery.$and || [];
        filterQuery.$and.push({ $or: filterQuery.$or });
        filterQuery.$and.push(discountCondition);
        delete filterQuery.$or;
      } else {
        filterQuery.$or = discountCondition.$or;
      }
    }

                // Filter by Unpaid Bills Only
      if (req.query.unpaidOnly === 'true') {
        filterQuery.billAmount = { $gt: 0 };
        filterQuery.$expr = {
          $gt: [
            { $subtract: ["$billAmount", { $ifNull: ["$billDiscount", 0] }] },
            { $ifNull: ["$paidAmount", 0] }
          ]
        };
      }

      // Filter by Advance Only
      if (req.query.advanceOnly === 'true') {
        filterQuery.paymentType = 'Advance';
      }

      // Filter by GST Only
    if (req.query.gstOnly === 'true') {
      filterQuery.isGstApplied = true;
    }

    // Filter by Duplicates
    if (req.query.duplicates === 'true') {
      const duplicatesByBillAmount = await Payment.aggregate([
        {
          $match: { billAmount: { $gt: 0 } }
        },
        {
          $group: {
            _id: {
              panelId: '$panelId',
              paymentType: '$paymentType',
              billAmount: '$billAmount',
              date: { $dateToString: { format: '%Y-%m-%d %H:%M', date: '$timestamp', timezone: 'Asia/Kolkata' } }
            },
            count: { $sum: 1 },
            ids: { $push: '$_id' }
          }
        },
        {
          $match: { count: { $gt: 1 } }
        }
      ]);

      const duplicatesByAmountReceived = await Payment.aggregate([
        {
          $match: { amountReceived: { $gt: 0 } }
        },
        {
          $group: {
            _id: {
              panelId: '$panelId',
              paymentType: '$paymentType',
              amountReceived: '$amountReceived',
              date: { $dateToString: { format: '%Y-%m-%d %H:%M', date: '$timestamp', timezone: 'Asia/Kolkata' } }
            },
            count: { $sum: 1 },
            ids: { $push: '$_id' }
          }
        },
        {
          $match: { count: { $gt: 1 } }
        }
      ]);

      const duplicateIdsByBill = duplicatesByBillAmount.reduce((acc, group) => acc.concat(group.ids), []);
      const duplicateIdsByReceived = duplicatesByAmountReceived.reduce((acc, group) => acc.concat(group.ids), []);
      
      // Merge and remove duplicates from the ids list
      const allDuplicateIds = [...new Set([...duplicateIdsByBill, ...duplicateIdsByReceived].map(id => id.toString()))];
      filterQuery._id = { $in: allDuplicateIds };
    }

    let sortQuery = { timestamp: -1 };
    if (req.query.duplicates === 'true') {
      // Sort by panelId to group duplicates of the same panel together, then by timestamp
      sortQuery = { panelId: 1, timestamp: -1 };
    }

    const total = await Payment.countDocuments(filterQuery);
    const payments = await Payment.find(filterQuery)
      .populate('panelId', 'panelName category ownerName ownerEmail phoneNumber status gstNumber takeSopDiscount')
      .populate('addedBy', 'name email')
      .populate('editHistory.editedBy', 'name email')
      .sort(sortQuery)
      .skip(skip)
      .limit(limit)
      .lean();

    const totals = await Payment.aggregate([
      { $match: filterQuery },
      {
        $group: {
          _id: null,
          totalBillAmount: { $sum: '$billAmount' },
          totalBillDiscount: { $sum: '$billDiscount' },
          totalAmountReceived: { $sum: '$amountReceived' },
          totalPaymentDiscount: { $sum: '$paymentDiscount' },
          totalQuantity: { $sum: '$quantity' }
        }
      }
    ]);

    const totalBillAmount = totals.length > 0 ? totals[0].totalBillAmount : 0;
    const totalBillDiscount = totals.length > 0 ? totals[0].totalBillDiscount : 0;
    const totalAmountReceived = totals.length > 0 ? totals[0].totalAmountReceived : 0;
    const totalPaymentDiscount = totals.length > 0 ? totals[0].totalPaymentDiscount : 0;
    const totalQuantity = totals.length > 0 ? (totals[0].totalQuantity || 0) : 0;

    // Calculate totalOpeningBalance for unique panels in the current filtered view
    const uniquePanelIds = await Payment.distinct('panelId', filterQuery);
    const panelsForOB = await Panel.find({ _id: { $in: uniquePanelIds } });
    const totalOpeningBalance = panelsForOB.reduce((sum, p) => sum + (p.openingBalance || 0), 0);

    res.json({
      success: true,
      count: payments.length,
      total,
      totalOpeningBalance,
      totalBillAmount,
      totalBillDiscount,
      totalAmountReceived,
      totalPaymentDiscount,
      totalQuantity,
      pages: limit === 0 ? 1 : Math.ceil(total / limit),
      currentPage: page,
      payments,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

router.post('/', protect, hasPermission('add_payments'), async (req, res) => {
  const { panelId, paymentType, amountReceived, paymentMode, bankName, quantity, remark, unitPrice, billAmount, billDiscount, paymentDiscount, timestamp, allocations, isGstApplied } = req.body;

  try {
    if (!panelId || !paymentType || amountReceived === undefined || !paymentMode) {
      return res.status(400).json({ success: false, message: 'Please provide all required fields' });
    }

    const panel = await Panel.findById(panelId);
    if (!panel) {
      return res.status(404).json({ success: false, message: 'Panel not found' });
    }

    // Validate discounts
    if (billDiscount !== undefined && Number(billDiscount) < 0) {
      return res.status(400).json({ success: false, message: 'Bill discount cannot be negative' });
    }
    if (paymentDiscount !== undefined && Number(paymentDiscount) < 0) {
      return res.status(400).json({ success: false, message: 'Payment discount cannot be negative' });
    }
    if (billDiscount !== undefined && billAmount !== undefined && Number(billDiscount) > Number(billAmount)) {
      return res.status(400).json({ success: false, message: 'Bill discount cannot exceed bill amount' });
    }

    const isBill = Number(billAmount) > 0;
    const isPayment = Number(amountReceived) > 0;
    let payment;

    if (isPayment) {
      let totalAllocated = 0;
      const parsedAllocations = [];
      if (allocations && allocations.length > 0) {
        allocations.forEach(alloc => {
          if (Number(alloc.amount) > 0) {
            totalAllocated += Number(alloc.amount);
            parsedAllocations.push(alloc);
          }
        });
      }

      const excess = Number(amountReceived) - totalAllocated;

      if (totalAllocated > 0) {
        // Apply allocations: Create a separate receipt for each selected bill
        for (const alloc of parsedAllocations) {
          const bill = await Payment.findById(alloc.billId);
          if (bill) {
            // Create separate receipt for this specific bill allocation
            const allocPayment = await Payment.create({
              panelId,
              paymentType: bill.paymentType, // Use the bill's actual payment type
              amountReceived: Number(alloc.amount),
              paymentMode,
              bankName: bankName || '',
              quantity: (quantity !== undefined && quantity !== null && quantity !== '') ? Number(quantity) : 0,
              unitPrice: Number(unitPrice) || 0,
              billAmount: 0,
              billDiscount: 0,
              paymentDiscount: 0,
              remark: remark ? `${remark} (Payment applied to ${bill.paymentType} charge)` : `Payment applied to ${bill.paymentType} charge`,
              addedBy: req.user._id,
              timestamp: timestamp ? new Date(timestamp) : undefined,
              isGstApplied: isGstApplied || false,
            });

            // If we don't have a main payment object yet, set this as the default to return in response
            if (!payment) {
              payment = allocPayment;
            }

            bill.paidAmount += Number(alloc.amount);
            if (bill.paidAmount >= (bill.billAmount - (bill.billDiscount || 0))) {
              bill.status = 'Paid';
            } else {
              bill.status = 'Partial';
            }
            bill.appliedPayments.push({
              paymentId: allocPayment._id,
              amount: Number(alloc.amount),
            });
            await bill.save();
          }
        }

        // Entry 2: If there is excess, create a separate receipt with paymentType 'Advance'
        if (excess > 0) {
          const baseDate = timestamp ? new Date(timestamp) : new Date();
          const advanceTimestamp = new Date(baseDate.getTime() + 1000);

          const creditPayment = await Payment.create({
            panelId,
            paymentType: 'Advance', // Changed from 'Other' to 'Advance'
            amountReceived: excess,
            paymentMode,
            bankName: bankName || '',
            quantity: 0,
            unitPrice: 0,
            billAmount: 0,
            billDiscount: 0,
            paymentDiscount: 0,
            remark: remark ? `${remark} (Advance Credit Deposit)` : 'Advance Credit Deposit',
            addedBy: req.user._id,
            timestamp: advanceTimestamp,
          });

          // Set this as returned payment if not set
          if (!payment) {
            payment = creditPayment;
          }

          panel.creditBalance += excess;
          await panel.save();
        }
      } else {
        // No allocations: automatically apply incoming payment to oldest unpaid bills first
        const unpaidBills = await Payment.find({
          panelId,
          billAmount: { $gt: 0 },
          $or: [
            { status: { $in: ['Unpaid', 'Partial'] } },
            { status: { $exists: false } },
            { status: null }
          ]
        }).sort({ timestamp: 1 });

        let remainingAmount = Number(amountReceived);

        for (const bill of unpaidBills) {
          if (remainingAmount <= 0) break;

          const remainingToPay = (bill.billAmount - (bill.billDiscount || 0)) - bill.paidAmount;
          if (remainingToPay <= 0) {
            bill.status = 'Paid';
            await bill.save();
            continue;
          }

          const payAmount = Math.min(remainingAmount, remainingToPay);
          if (payAmount > 0) {
            // Create a real payment receipt directly paying this bill
            const allocPayment = await Payment.create({
              panelId,
              paymentType: bill.paymentType,
              amountReceived: payAmount,
              paymentMode,
              bankName: bankName || '',
              quantity: (quantity !== undefined && quantity !== null && quantity !== '') ? Number(quantity) : 0,
              unitPrice: Number(unitPrice) || 0,
              billAmount: 0,
              billDiscount: 0,
              paymentDiscount: 0,
              remark: remark ? `${remark} (Auto-applied to ${bill.paymentType} bill)` : `Auto-applied to ${bill.paymentType} bill`,
              addedBy: req.user._id,
              timestamp: timestamp ? new Date(timestamp) : undefined,
              isGstApplied: isGstApplied || false,
            });

            if (!payment) {
              payment = allocPayment;
            }

            bill.paidAmount += payAmount;
            if (bill.paidAmount >= (bill.billAmount - (bill.billDiscount || 0))) {
              bill.status = 'Paid';
            } else {
              bill.status = 'Partial';
            }
            bill.appliedPayments.push({
              paymentId: allocPayment._id,
              amount: payAmount
            });
            await bill.save();

            remainingAmount -= payAmount;
          }
        }

        // If excess remains, create an Advance payment receipt and add to panel credit balance
        if (remainingAmount > 0) {
          const baseDate = timestamp ? new Date(timestamp) : new Date();
          const advanceTimestamp = new Date(baseDate.getTime() + 1000);

          const creditPayment = await Payment.create({
            panelId,
            paymentType: 'Advance',
            amountReceived: remainingAmount,
            paymentMode,
            bankName: bankName || '',
            quantity: 0,
            unitPrice: 0,
            billAmount: 0,
            billDiscount: 0,
            paymentDiscount: Number(paymentDiscount) || 0,
            remark: remark ? `${remark} (Advance Credit Deposit)` : 'Advance Credit Deposit',
            addedBy: req.user._id,
            timestamp: advanceTimestamp,
          });

          if (!payment) {
            payment = creditPayment;
          }

          panel.creditBalance += remainingAmount;
          await panel.save();
        }
      }
    } else if (isBill) {
      payment = await Payment.create({
        panelId,
        paymentType,
        amountReceived: 0,
        paymentMode,
        bankName: bankName || '',
        quantity: (quantity !== undefined && quantity !== null && quantity !== '') ? Number(quantity) : 0,
        unitPrice: Number(unitPrice) || 0,
        billAmount: Number(billAmount) || 0,
        billDiscount: Number(billDiscount) || 0,
        paymentDiscount: 0,
        remark: remark || '',
        addedBy: req.user._id,
        timestamp: timestamp ? new Date(timestamp) : undefined,
        isGstApplied: isGstApplied || false,
      });

      // Automatically apply any existing credit to the new bill
      await applyCreditToUnpaidBills(panelId);
    }

    // Create custom detailed activity log
    let logDetails = `Received payment of ₹${amountReceived} (${paymentType}) from panel ${panel.panelName} via ${paymentMode}`;
    if (Number(paymentDiscount) > 0) {
      logDetails += ` (Discount: ₹${paymentDiscount})`;
    } else if (Number(billAmount) > 0) {
      logDetails = `Generated bill of ₹${billAmount} (${paymentType}) for panel ${panel.panelName}`;
      if (Number(billDiscount) > 0) {
        logDetails += ` (Discount: ₹${billDiscount})`;
      }
    }

    await Log.create({
      userId: req.user._id,
      actionType: 'ADD',
      module: 'Payment',
      details: logDetails,
      ipAddress: getClientIp(req),
    });

    res.status(201).json({ success: true, payment });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// @desc    Get a single payment by ID
// @route   GET /api/payments/:id
// @access  Private (view_panels permission)
router.get('/:id', protect, hasPermission('view_panels'), async (req, res) => {
  try {
    const payment = await Payment.findById(req.params.id)
      .populate('panelId', 'panelName category ownerName ownerEmail phoneNumber status')
      .populate('addedBy', 'name email')
      .populate('editHistory.editedBy', 'name email')
      .lean();
    if (!payment) {
      return res.status(404).json({ success: false, message: 'Payment not found' });
    }
    res.json({ success: true, payment });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// @desc    Edit a payment
// @route   PUT /api/payments/:id
// @access  Private (edit_payments permission)
router.put('/:id', protect, hasPermission('edit_payments'), async (req, res) => {
  const { paymentType, amountReceived, paymentMode, bankName, quantity, remark, timestamp, billDiscount, paymentDiscount, isGstApplied } = req.body;

  try {
    const payment = await Payment.findById(req.params.id).populate('panelId', 'panelName category');
    if (!payment) {
      return res.status(404).json({ success: false, message: 'Payment not found' });
    }

    // Validate discounts
    if (billDiscount !== undefined && Number(billDiscount) < 0) {
      return res.status(400).json({ success: false, message: 'Bill discount cannot be negative' });
    }
    if (paymentDiscount !== undefined && Number(paymentDiscount) < 0) {
      return res.status(400).json({ success: false, message: 'Payment discount cannot be negative' });
    }

    const oldAmount = payment.amountReceived;
    const oldType = payment.paymentType;
    const oldMode = payment.paymentMode;
    const oldBank = payment.bankName;
    const oldQty = payment.quantity;
    const oldPrice = payment.unitPrice;
    const oldBill = payment.billAmount;
    const oldBillDiscount = payment.billDiscount || 0;
    const oldPaymentDiscount = payment.paymentDiscount || 0;
    const oldRemark = payment.remark;
    const oldTimestamp = payment.timestamp;
    const oldIsGstApplied = payment.isGstApplied;

    payment.paymentType = paymentType || payment.paymentType;
    payment.amountReceived = amountReceived !== undefined ? Number(amountReceived) : payment.amountReceived;
    payment.paymentMode = paymentMode || payment.paymentMode;
    payment.bankName = bankName !== undefined ? bankName : payment.bankName;
    payment.quantity = quantity !== undefined ? Number(quantity) : payment.quantity;
    payment.unitPrice = req.body.unitPrice !== undefined ? Number(req.body.unitPrice) : payment.unitPrice;
    payment.billAmount = req.body.billAmount !== undefined ? Number(req.body.billAmount) : payment.billAmount;
    payment.billDiscount = billDiscount !== undefined ? Number(billDiscount) : (payment.billDiscount || 0);
    payment.paymentDiscount = paymentDiscount !== undefined ? Number(paymentDiscount) : (payment.paymentDiscount || 0);
    payment.remark = remark !== undefined ? remark : payment.remark;
    if (timestamp) {
      payment.timestamp = new Date(timestamp);
    }
    if (isGstApplied !== undefined) {
      payment.isGstApplied = isGstApplied;
    }

    // Validate bill discount against final bill amount
    if (payment.billDiscount > payment.billAmount) {
      return res.status(400).json({ success: false, message: 'Bill discount cannot exceed bill amount' });
    }

    // Track changes
    const changesArray = [];
    if (oldType !== payment.paymentType) changesArray.push(`Type: ${oldType} ➔ ${payment.paymentType}`);
    if (oldAmount !== payment.amountReceived) changesArray.push(`Paid: ₹${oldAmount} ➔ ₹${payment.amountReceived}`);
    if (oldMode !== payment.paymentMode) changesArray.push(`Mode: ${oldMode} ➔ ${payment.paymentMode}`);
    if (oldBank !== payment.bankName) changesArray.push(`Bank: "${oldBank || 'N/A'}" ➔ "${payment.bankName || 'N/A'}"`);
    if (oldQty !== payment.quantity) changesArray.push(`Qty: ${oldQty} ➔ ${payment.quantity}`);
    if (oldPrice !== payment.unitPrice) changesArray.push(`Price: ₹${oldPrice} ➔ ₹${payment.unitPrice}`);
    if (oldBill !== payment.billAmount) changesArray.push(`Bill: ₹${oldBill} ➔ ₹${payment.billAmount}`);
    if (oldBillDiscount !== payment.billDiscount) changesArray.push(`Bill Discount: ₹${oldBillDiscount} ➔ ₹${payment.billDiscount}`);
    if (oldPaymentDiscount !== payment.paymentDiscount) changesArray.push(`Payment Discount: ₹${oldPaymentDiscount} ➔ ₹${payment.paymentDiscount}`);
    if (oldRemark !== payment.remark) changesArray.push(`Remark: "${oldRemark || 'N/A'}" ➔ "${payment.remark || 'N/A'}"`);
    if (timestamp && new Date(oldTimestamp).getTime() !== new Date(payment.timestamp).getTime()) {
      changesArray.push(`Date: ${new Date(oldTimestamp).toLocaleDateString()} ➔ ${new Date(payment.timestamp).toLocaleDateString()}`);
    }
    if (oldIsGstApplied !== payment.isGstApplied) {
      changesArray.push(`GST Applied: ${oldIsGstApplied ? 'Yes' : 'No'} ➔ ${payment.isGstApplied ? 'Yes' : 'No'}`);
    }

    if (changesArray.length > 0) {
      payment.editHistory.push({
        editedBy: req.user._id,
        editedAt: new Date(),
        changes: changesArray.join(' | '),
      });
    }

    let updatedPayment = await payment.save();

    // Populate the newly added editHistory's editedBy before returning
    updatedPayment = await Payment.findById(updatedPayment._id)
      .populate('panelId', 'panelName category ownerName ownerEmail phoneNumber status')
      .populate('addedBy', 'name email')
      .populate('editHistory.editedBy', 'name email');

    // Create activity log
    await Log.create({
      userId: req.user._id,
      actionType: 'EDIT',
      module: 'Payment',
      details: `Edited payment for panel ${payment.panelId.panelName}. Changes: ${changesArray.join(' | ')}`,
      ipAddress: getClientIp(req),
    });

    res.json({ success: true, payment: updatedPayment });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// @desc    Delete a payment
// @route   DELETE /api/payments/:id
// @access  Private (Admin Only - to prevent fraud)
router.delete('/:id', protect, adminOnly, async (req, res) => {
  try {
    const payment = await Payment.findById(req.params.id).populate('panelId', 'panelName');
    if (!payment) {
      return res.status(404).json({ success: false, message: 'Payment record not found' });
    }

    await Payment.findByIdAndDelete(req.params.id);

    // Create activity log
    await Log.create({
      userId: req.user._id,
      actionType: 'DELETE',
      module: 'Payment',
      details: `Deleted payment record of ₹${payment.amountReceived} from panel ${payment.panelId.panelName}`,
      ipAddress: getClientIp(req),
    });

    res.json({ success: true, message: 'Payment record deleted successfully' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

module.exports = router;
