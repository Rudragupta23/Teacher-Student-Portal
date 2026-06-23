const Resource = require('../models/Resource');

exports.createResource = async (req, res) => {
    try {
        const { title, description, type, url } = req.body;
        const resource = new Resource({ title, description, type, url });
        await resource.save();
        res.status(201).json({ message: "Resource added successfully!", resource });
    } catch (error) {
        res.status(500).json({ message: "Error uploading resource" });
    }
};

exports.getResources = async (req, res) => {
    try {
        const resources = await Resource.find().sort({ createdAt: -1 });
        res.status(200).json(resources);
    } catch (error) {
        res.status(500).json({ message: "Error fetching resources" });
    }
};

exports.deleteResource = async (req, res) => {
    try {
        await Resource.findByIdAndDelete(req.params.id);
        res.status(200).json({ message: "Resource deleted" });
    } catch (error) {
        res.status(500).json({ message: "Error deleting resource" });
    }
};