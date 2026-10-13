require('dotenv').config();   // 👈 MUST be line 1


const express = require('express');
const mongoose = require('mongoose');
const bodyParser = require('body-parser');
const cors = require('cors');

const app = express();

app.use(bodyParser.json({ limit: '10mb' }));
app.use(cors());

const dbURI =
  "mongodb+srv://oshan:oshan%40work1234@cluster0.2txxi.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0";

mongoose
  .connect(dbURI, { useNewUrlParser: true, useUnifiedTopology: true })
  .then(() => console.log("Connected to MongoDB Atlas"))
  .catch((err) => {
    console.error("Failed to connect to MongoDB:", err);
    process.exit(1);
  });

// Schema
const taskSchema = new mongoose.Schema({
  name: String,
  email: String,
  phone: String,
  altPhone: String,
  state: String,
  city: String,
  pincode: String,
  location: String,
  landmark: String,
  product: String,
  selectedModel: Object,
  serialNumber: String,
  warrantyStatus: Object,
  purchaseDate: String,
  installationDate: String,
  status: String,
  complaintNumber: { type: String, index: true },
  callType: String,
  additionalStatus: String,
  callSource: String,
  taskStatus: String,
  assignEngineer: { type: String, index: true },
  contactNo: String,
  dealer: String,
  complaintNotes: String,
  enginnerNotes: String,
  customerFeedback: String,
  date: { type: String, index: true },   // "Date of complaint registered"
  asp: String,
  aspName: String,
  actionTaken: String,
  images: [String],
}, { timestamps: true });

// Compound index for date-range + status queries
taskSchema.index({ date: 1, status: 1 });

const Task = mongoose.model("Task", taskSchema);

/* ------------------------------------------------------------------ */
/*  Helper: build a Mongo filter from query params                    */
/* ------------------------------------------------------------------ */
function buildFilter(query) {
  const { startDate, endDate, status, assignEngineer, state, city, search } = query;
  const filter = {};

  // ---- DATE RANGE FILTER ----
  // Works whether `date` is stored as "YYYY-MM-DD" or full ISO string.
  if (startDate || endDate) {
    filter.date = {};
    if (startDate) filter.date.$gte = startDate;           // e.g. "2024-01-01"
    if (endDate)   filter.date.$lte = endDate + '\uffff';  // include whole end day
  }

  // ---- Other optional filters ----
  if (status)         filter.status = status;
  if (assignEngineer) filter.assignEngineer = assignEngineer;
  if (state)          filter.state = state;
  if (city)           filter.city = city;

  // ---- Text search across common fields ----
  if (search) {
    const rx = new RegExp(search, 'i');
    filter.$or = [
      { complaintNumber: rx },
      { name: rx },
      { phone: rx },
      { contactNo: rx },
      { serialNumber: rx },
    ];
  }

  return filter;
}

/* ------------------------------------------------------------------ */
/*  Routes                                                            */
/* ------------------------------------------------------------------ */

// CREATE
app.post('/tasks', async (req, res) => {
  try {
    const task = new Task(req.body);
    await task.save();
    res.status(201).json(task);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to save task", details: err.message });
  }
});

// READ (with date-range + pagination + filters)
// Example: GET /tasks?startDate=2024-01-01&endDate=2024-01-31&page=1&limit=100
app.get('/tasks', async (req, res) => {
  try {
    const page  = Math.max(parseInt(req.query.page)  || 1, 1);

    // ⬇️ CHANGED: default 500, cap 20000
    const limit = Math.min(parseInt(req.query.limit) || 500, 20000);
    const skip  = (page - 1) * limit;

    const filter = buildFilter(req.query);

    const [total, tasks] = await Promise.all([
      Task.countDocuments(filter),
      Task.find(filter).sort({ date: -1 }).skip(skip).limit(limit).lean(),
    ]);

    res.status(200).json({
      data: tasks,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
        hasNext: page * limit < total,
        hasPrev: page > 1,
      },
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to fetch tasks", details: err.message });
  }
});

// STATS (fast counts without loading data)
app.get('/tasks/stats', async (req, res) => {
  try {
    const filter = buildFilter(req.query);
    const total = await Task.countDocuments(filter);
    res.json({ total });
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch stats", details: err.message });
  }
});

// UPDATE
app.put('/tasks/:id', async (req, res) => {
  try {
    const task = await Task.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!task) return res.status(404).json({ error: "Task not found" });
    res.json(task);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to update task", details: err.message });
  }
});

// DELETE
app.delete('/tasks/:id', async (req, res) => {
  try {
    const task = await Task.findByIdAndDelete(req.params.id);
    if (!task) return res.status(404).json({ error: "Task not found" });
    res.json({ message: "Task deleted" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to delete task", details: err.message });
  }
});

// Start server
const port = process.env.PORT || 5002;
app.listen(port, () => console.log(`Server running on port ${port}`));


// const express = require('express');
// const mongoose = require('mongoose');
// const bodyParser = require('body-parser');
// const cors = require('cors');
// const compression = require('compression');
// const NodeCache = require('node-cache');

// // Initialize Express app
// const app = express();
// const cache = new NodeCache({ stdTTL: 3600 });   // Cache for 1 hour

// // Middleware
// app.use(bodyParser.json());
// app.use(cors());
// app.use(compression());

// // MongoDB Atlas connection
// const dbURI =
//   "mongodb+srv://oshan:oshan%40work1234@cluster0.2txxi.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0";

// mongoose
//   .connect(dbURI, { useNewUrlParser: true, useUnifiedTopology: true })
//   .then(() => console.log("Connected to MongoDB Atlas"))
//   .catch((err) => {
//     console.error("Failed to connect to MongoDB:", err);
//     process.exit(1);
//   });


// // Task Schema
// const taskSchema = new mongoose.Schema({
//   name: String,
//   email: String,
//   phone: String,
//   altPhone: String,

//   state: String,
//   city: String,
//   pincode: String,
//   location: String,
//   landmark: String,

//   product: String,
//   selectedModel: Object,
//   serialNumber: String,
//   warrantyStatus: Object,
//   purchaseDate: String,
//   installationDate: String,

//   status: String,
//   complaintNumber: String,
//   callType: String,
//   additionalStatus: String,
//   callSource: String,
//   taskStatus: String,

//   assignEngineer: String,
//   contactNo: String,

//   dealer: String,
//   complaintNotes: String,
//   enginnerNotes: String,
//   customerFeedback: String,

//   asp: String,
//   aspName: String,
//   actionTaken: String,

//   date: String,
//   images: [String]
// });

// const Task = mongoose.model("Task", taskSchema);



// // ==================================================================
// //  ADD TASK
// // ==================================================================
// app.post("/tasks", async (req, res) => {
//   try {
//     const task = new Task(req.body);
//     await task.save();

//     // Clear cache after adding new data
//     cache.del("tasks_page");

//     res.status(201).json(task);
//   } catch (err) {
//     console.error("Error saving task:", err);
//     res.status(500).json({ error: "Failed to save task." });
//   }
// });


// // ==================================================================
// //  GET TASKS WITH PAGINATION + CACHING
// // ==================================================================
// app.get("/tasks", async (req, res) => {
//   try {
//     const page = parseInt(req.query.page) || 1; // current page
//     const limit = parseInt(req.query.limit) || 20; // items per page
//     const skip = (page - 1) * limit;

//     const cacheKey = `tasks_page_${page}`;

//     // Serve from cache
//     if (cache.has(cacheKey)) {
//       return res.status(200).json(cache.get(cacheKey));
//     }

//     const totalTasks = await Task.countDocuments();
//     const tasks = await Task.find().skip(skip).limit(limit).lean();

//     const responseData = {
//       tasks,
//       totalTasks,
//       currentPage: page,
//       totalPages: Math.ceil(totalTasks / limit),
//     };

//     // Save in cache
//     cache.set(cacheKey, responseData);

//     res.status(200).json(responseData);
//   } catch (err) {
//     console.error("Error fetching tasks:", err);
//     res.status(500).json({ error: "Failed to fetch tasks." });
//   }
// });


// // ==================================================================
// //  UPDATE TASK
// // ==================================================================
// app.put("/tasks/:id", async (req, res) => {
//   try {
//     const task = await Task.findByIdAndUpdate(
//       req.params.id,
//       req.body,
//       { new: true }
//     );

//     if (!task) {
//       return res.status(404).json({ error: "Task not found" });
//     }

//     // Clear cache after update
//     cache.flushAll();

//     res.status(200).json(task);
//   } catch (err) {
//     console.error("Error updating task:", err);
//     res.status(500).json({ error: "Failed to update task." });
//   }
// });


// // ==================================================================
// //  DELETE TASK
// // ==================================================================
// app.delete("/tasks/:id", async (req, res) => {
//   try {
//     const task = await Task.findByIdAndDelete(req.params.id);

//     if (!task) {
//       return res.status(404).json({ error: "Task not found" });
//     }

//     // Clear cache after deletion
//     cache.flushAll();

//     res.status(200).json({ message: "Task deleted" });
//   } catch (err) {
//     console.error("Error deleting task:", err);
//     res.status(500).json({ error: "Failed to delete task." });
//   }
// });


// // ==================================================================
// //  START SERVER
// // ==================================================================
// const PORT = process.env.PORT || 5002;
// app.listen(PORT, () => {
//   console.log(`🚀 Server running on port ${PORT}`);
// });
