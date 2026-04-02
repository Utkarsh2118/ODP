const { body, param } = require("express-validator");
const Campaign = require("../models/Campaign");
const Donation = require("../models/Donation");

const campaignValidation = [
  body("title").trim().notEmpty().withMessage("Title is required"),
  body("description").trim().notEmpty().withMessage("Description is required"),
  body("goalAmount").isFloat({ min: 1 }).withMessage("Goal amount must be greater than 0"),
  body("imageUrl").optional().isURL().withMessage("Image URL must be valid"),
];

const campaignIdValidation = [param("id").isMongoId().withMessage("Invalid campaign ID")];

const getCampaigns = async (req, res) => {
  const campaigns = await Campaign.find({ isActive: true }).sort({ createdAt: -1 });
  res.status(200).json({ success: true, campaigns });
};

const getCampaignById = async (req, res) => {
  const campaign = await Campaign.findById(req.params.id);

  if (!campaign || !campaign.isActive) {
    return res.status(404).json({ success: false, message: "Campaign not found" });
  }

  return res.status(200).json({ success: true, campaign });
};

const createCampaign = async (req, res) => {
  const campaign = await Campaign.create(req.body);
  return res.status(201).json({ success: true, campaign });
};

const updateCampaign = async (req, res) => {
  const campaign = await Campaign.findByIdAndUpdate(req.params.id, req.body, {
    new: true,
    runValidators: true,
  });

  if (!campaign) {
    return res.status(404).json({ success: false, message: "Campaign not found" });
  }

  return res.status(200).json({ success: true, campaign });
};

const deleteCampaign = async (req, res) => {
  const campaign = await Campaign.findByIdAndUpdate(req.params.id, { isActive: false }, { new: true });

  if (!campaign) {
    return res.status(404).json({ success: false, message: "Campaign not found" });
  }

  return res.status(200).json({ success: true, message: "Campaign deleted" });
};

const campaignStats = async (req, res) => {
  const stats = await Donation.aggregate([
    {
      $match: {
        status: "success",
      },
    },
    {
      $group: {
        _id: "$campaign",
        totalFunds: { $sum: "$amount" },
        donationsCount: { $sum: 1 },
      },
    },
    {
      $lookup: {
        from: "campaigns",
        localField: "_id",
        foreignField: "_id",
        as: "campaign",
      },
    },
    { $unwind: "$campaign" },
    {
      $project: {
        _id: 0,
        campaignId: "$campaign._id",
        title: "$campaign.title",
        totalFunds: 1,
        donationsCount: 1,
      },
    },
  ]);

  return res.status(200).json({ success: true, stats });
};

module.exports = {
  campaignValidation,
  campaignIdValidation,
  getCampaigns,
  getCampaignById,
  createCampaign,
  updateCampaign,
  deleteCampaign,
  campaignStats,
};
