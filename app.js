const express = require("express");
const mongoose = require("mongoose");
const Joi = require("joi");
const dotenv = require("dotenv");

dotenv.config();
const app = express();
app.use(express.json());

// MongoDB Connection using your provided URL
mongoose
  .connect(
    "mongodb+srv://asblaster100:testing12345@cluster0.opkvswq.mongodb.net/?retryWrites=true&w=majority",
    {
    }
  )
  .then(() => console.log("MongoDB connected"))
  .catch((err) => {
    console.error("MongoDB connection error", err);
    process.exit(1);
  });

// Mongoose Model
const playerSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    team: { type: String, required: true },
    country: { type: String, required: true },
    runs: { type: Number, required: true },
    image: { type: String, required: true },
    role: {
      type: String,
      enum: ["Batsman", "Bowler", "All-rounder"],
      required: true,
    },
    salary: { type: Number, required: true },
  },
  { timestamps: true }
);

const Player = mongoose.model("Player", playerSchema);

// Joi Validation Schema
const playerValidation = Joi.object({
  name: Joi.string().required(),
  team: Joi.string().required(),
  country: Joi.string().required(),
  runs: Joi.number().integer().required(),
  image: Joi.string().uri().required(),
  role: Joi.string().valid("Batsman", "Bowler", "All-rounder").required(),
  salary: Joi.number().positive().required(),
});







// Create Player
app.post("/players", async (req, res) => {
  try {
    await playerValidation.validateAsync(req.body);
    const player = new Player(req.body);
    await player.save();
    res.status(201).json({ message: "Player created successfully" });
  } catch (err) {
    res.status(400).json({ error: err.details?.[0]?.message || err.message });
  }
});

// List All Players with Pagination, Filter, Sort, Search
app.get("/players", async (req, res) => {
  try {
    const { page = 1, limit = 10, team, sortBy, search } = req.query;
    const query = {};
    if (team) query.team = team;
    if (search) query.name = { $regex: search, $options: "i" };

    const sortOptions = {};
    if (sortBy === "runs" || sortBy === "salary") sortOptions[sortBy] = -1;

    const total = await Player.countDocuments(query);
    const players = await Player.find(query)
      .sort(sortOptions)
      .skip((page - 1) * limit)
      .limit(parseInt(limit));

    res.json({ page: +page, limit: +limit, total, players });
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch players" });
  }
});

// Update Player
app.patch("/players/:id", async (req, res) => {
  try {
    await playerValidation.validateAsync(req.body);
    const updated = await Player.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
    });
    if (!updated) return res.status(404).json({ message: "Player not found" });
    res.json({ message: "Player updated successfully" });
  } catch (err) {
    res.status(400).json({ error: err.details?.[0]?.message || err.message });
  }
});

// Delete Player
app.delete("/players/:id", async (req, res) => {
  try {
    const deleted = await Player.findByIdAndDelete(req.params.id);
    if (!deleted) return res.status(404).json({ message: "Player not found" });
    res.json({ message: "Player deleted successfully" });
  } catch (err) {
    res.status(500).json({ error: "Failed to delete player" });
  }
});

// Get Player Description
app.get("/players/:id/description", async (req, res) => {
  try {
    const player = await Player.findById(req.params.id);
    if (!player) return res.status(404).json({ message: "Player not found" });
    res.json(player);
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch player details" });
  }
});

// Server
const PORT = process.env.PORT || 6001;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
