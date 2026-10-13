const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");

const app = express();

const PORT = 5000;

app.use(cors());
app.use(express.json());

// ======================================================
// MONGODB
// ======================================================

mongoose
  .connect(
    process.env.MONGO_URI ||
      // "mongodb+srv://YOUR_USERNAME:YOUR_PASSWORD@cluster0.jjjc03f.mongodb.net/serviceDB?retryWrites=true&w=majority"
      "mongodb+srv://jayantsoni4382:js%40workdb@cluster0.jjjc03f.mongodb.net/attendanceDB?retryWrites=true&w=majority"
  )
  .then(() => {
    console.log("MongoDB connected");
  })
  .catch((error) => {
    console.error("MongoDB Error:", error);
  });

// ======================================================
// COMMON SERVICE CASE
// ======================================================
//
// THIS IS THE IMPORTANT PART.
//
// These fields are stored ONLY here:
//
// Complaint
// Customer / Distributor
// Serial No.
// Part Serial No.
// Job Card
//
// All TRC / IQC / Repair / OQC records reference this
// common record using caseId.
//

const serviceCaseSchema = new mongoose.Schema(
  {
    complaint: {
      type: String,
      required: true,
      unique: true,
      trim: true,
    },

    customerDistributor: {
      type: String,
      required: true,
      trim: true,
    },

    serialNo: {
      type: String,
      required: true,
      trim: true,
    },

    partSerialNo: {
      type: String,
      required: true,
      trim: true,
    },

    jobCard: {
      type: String,
      required: true,
      trim: true,
    },
  },
  {
    timestamps: true,
  }
);

const ServiceCase = mongoose.model(
  "ServiceCase",
  serviceCaseSchema,
  "service_cases"
);

// ======================================================
// TRC
// ======================================================

const trcSchema = new mongoose.Schema(
  {
    caseId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "ServiceCase",
      required: true,
      unique: true,
    },

    modelName: {
      type: String,
      required: true,
      trim: true,
    },

    modelSerialNo: {
      type: String,
      required: true,
      trim: true,
    },

    health: {
      type: String,
      required: true,
      trim: true,
    },
  },
  {
    timestamps: true,
  }
);

const TRC = mongoose.model(
  "TRC",
  trcSchema,
  "trcs"
);

// ======================================================
// IQC COMPONENT
// ======================================================

const iqcComponentSchema = new mongoose.Schema(
  {
    componentName: {
      type: String,
      required: true,
      trim: true,
    },

    warranty: {
      type: String,
      required: true,
      trim: true,
    },

    status: {
      type: String,
      required: true,
      trim: true,
    },

    result: {
      type: String,
      required: true,
      trim: true,
    },
  },
  {
    _id: true,
  }
);

// ======================================================
// IQC
// ======================================================

const iqcSchema = new mongoose.Schema(
  {
    caseId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "ServiceCase",
      required: true,
      unique: true,
    },

    components: {
      type: [iqcComponentSchema],
      default: [],
    },
  },
  {
    timestamps: true,
  }
);

const IQC = mongoose.model(
  "IQC",
  iqcSchema,
  "iqcs"
);

// ======================================================
// REPAIR COMPONENT
// ======================================================

const replacementComponentSchema =
  new mongoose.Schema(
    {
      componentName: {
        type: String,
        required: true,
        trim: true,
      },

      warranty: {
        type: String,
        required: true,
        trim: true,
      },

      status: {
        type: String,
        required: true,
        trim: true,
      },

      result: {
        type: String,
        enum: ["Pass", "Fail"],
        required: true,
      },
    },
    {
      _id: true,
    }
  );

// ======================================================
// REPAIR
// ======================================================

const repairSchema = new mongoose.Schema(
  {
    caseId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "ServiceCase",
      required: true,
      unique: true,
    },

    replacementComponents: {
      type: [replacementComponentSchema],
      default: [],
    },
  },
  {
    timestamps: true,
  }
);

const Repair = mongoose.model(
  "Repair",
  repairSchema,
  "repairs"
);

// ======================================================
// OQC TESTING
// ======================================================

const testingSchema = new mongoose.Schema(
  {
    testName: {
      type: String,
      required: true,
      trim: true,
    },

    status: {
      type: String,
      enum: ["Pass", "Failed"],
      required: true,
    },
  },
  {
    _id: true,
  }
);

// ======================================================
// OQC
// ======================================================

const oqcSchema = new mongoose.Schema(
  {
    caseId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "ServiceCase",
      required: true,
      unique: true,
    },

    testing: {
      type: [testingSchema],
      default: [],
    },
  },
  {
    timestamps: true,
  }
);

const OQC = mongoose.model(
  "OQC",
  oqcSchema,
  "oqcs"
);

// ======================================================
// COMMON CASE ROUTES
// ======================================================

// GET ALL COMMON CASES

app.get("/api/cases", async (req, res) => {
  try {
    const data = await ServiceCase.find().sort({
      createdAt: -1,
    });

    res.json(data);
  } catch (error) {
    res.status(500).json({
      message: error.message,
    });
  }
});

// GET ONE COMMON CASE

app.get("/api/cases/:id", async (req, res) => {
  try {
    const data = await ServiceCase.findById(
      req.params.id
    );

    if (!data) {
      return res.status(404).json({
        message: "Case not found",
      });
    }

    res.json(data);
  } catch (error) {
    res.status(500).json({
      message: error.message,
    });
  }
});

// CREATE COMMON CASE

app.post("/api/cases", async (req, res) => {
  try {
    const data = await ServiceCase.create({
      complaint: req.body.complaint,
      customerDistributor:
        req.body.customerDistributor,
      serialNo: req.body.serialNo,
      partSerialNo: req.body.partSerialNo,
      jobCard: req.body.jobCard,
    });

    res.status(201).json(data);
  } catch (error) {
    res.status(500).json({
      message: error.message,
    });
  }
});

// UPDATE COMMON CASE

app.put("/api/cases/:id", async (req, res) => {
  try {
    const data =
      await ServiceCase.findByIdAndUpdate(
        req.params.id,
        {
          complaint: req.body.complaint,
          customerDistributor:
            req.body.customerDistributor,
          serialNo: req.body.serialNo,
          partSerialNo: req.body.partSerialNo,
          jobCard: req.body.jobCard,
        },
        {
          new: true,
          runValidators: true,
        }
      );

    res.json(data);
  } catch (error) {
    res.status(500).json({
      message: error.message,
    });
  }
});

// DELETE COMMON CASE

app.delete("/api/cases/:id", async (req, res) => {
  try {
    const caseId = req.params.id;

    await TRC.deleteOne({ caseId });
    await IQC.deleteOne({ caseId });
    await Repair.deleteOne({ caseId });
    await OQC.deleteOne({ caseId });

    await ServiceCase.findByIdAndDelete(caseId);

    res.json({
      message: "Case deleted successfully",
    });
  } catch (error) {
    res.status(500).json({
      message: error.message,
    });
  }
});

// ======================================================
// TRC ROUTES
// ======================================================

// GET TRC

app.get("/api/trc", async (req, res) => {
  try {
    const data = await TRC.find()
      .populate("caseId")
      .sort({
        createdAt: -1,
      });

    res.json(data);
  } catch (error) {
    res.status(500).json({
      message: error.message,
    });
  }
});

// CREATE TRC

app.post("/api/trc", async (req, res) => {
  try {
    let serviceCase;

    // If existing case selected
    if (req.body.caseId) {
      serviceCase =
        await ServiceCase.findById(
          req.body.caseId
        );
    } else {
      // Create common case
      serviceCase =
        await ServiceCase.create({
          complaint: req.body.complaint,
          customerDistributor:
            req.body.customerDistributor,
          serialNo: req.body.serialNo,
          partSerialNo: req.body.partSerialNo,
          jobCard: req.body.jobCard,
        });
    }

    if (!serviceCase) {
      return res.status(404).json({
        message: "Common case not found",
      });
    }

    const trc = await TRC.create({
      caseId: serviceCase._id,
      modelName: req.body.modelName,
      modelSerialNo: req.body.modelSerialNo,
      health: req.body.health,
    });

    const result = await TRC.findById(
      trc._id
    ).populate("caseId");

    res.status(201).json(result);
  } catch (error) {
    res.status(500).json({
      message: error.message,
    });
  }
});

// UPDATE TRC

app.put("/api/trc/:id", async (req, res) => {
  try {
    const trc = await TRC.findById(
      req.params.id
    );

    if (!trc) {
      return res.status(404).json({
        message: "TRC not found",
      });
    }

    await ServiceCase.findByIdAndUpdate(
      trc.caseId,
      {
        complaint: req.body.complaint,
        customerDistributor:
          req.body.customerDistributor,
        serialNo: req.body.serialNo,
        partSerialNo: req.body.partSerialNo,
        jobCard: req.body.jobCard,
      },
      {
        runValidators: true,
      }
    );

    const updated = await TRC.findByIdAndUpdate(
      req.params.id,
      {
        modelName: req.body.modelName,
        modelSerialNo: req.body.modelSerialNo,
        health: req.body.health,
      },
      {
        new: true,
        runValidators: true,
      }
    ).populate("caseId");

    res.json(updated);
  } catch (error) {
    res.status(500).json({
      message: error.message,
    });
  }
});

// DELETE TRC

app.delete("/api/trc/:id", async (req, res) => {
  try {
    const trc = await TRC.findById(
      req.params.id
    );

    if (!trc) {
      return res.status(404).json({
        message: "TRC not found",
      });
    }

    await TRC.findByIdAndDelete(req.params.id);

    // Keep common case because it can be used
    // by IQC / Repair / OQC.

    res.json({
      message: "TRC deleted successfully",
    });
  } catch (error) {
    res.status(500).json({
      message: error.message,
    });
  }
});

// ======================================================
// IQC ROUTES
// ======================================================

app.get("/api/iqc", async (req, res) => {
  try {
    const data = await IQC.find()
      .populate("caseId")
      .sort({
        createdAt: -1,
      });

    res.json(data);
  } catch (error) {
    res.status(500).json({
      message: error.message,
    });
  }
});

app.post("/api/iqc", async (req, res) => {
  try {
    const iqc = await IQC.create({
      caseId: req.body.caseId,
      components: req.body.components || [],
    });

    const result = await IQC.findById(
      iqc._id
    ).populate("caseId");

    res.status(201).json(result);
  } catch (error) {
    res.status(500).json({
      message: error.message,
    });
  }
});

app.put("/api/iqc/:id", async (req, res) => {
  try {
    const data = await IQC.findByIdAndUpdate(
      req.params.id,
      {
        components: req.body.components || [],
      },
      {
        new: true,
        runValidators: true,
      }
    ).populate("caseId");

    res.json(data);
  } catch (error) {
    res.status(500).json({
      message: error.message,
    });
  }
});

app.delete("/api/iqc/:id", async (req, res) => {
  try {
    await IQC.findByIdAndDelete(req.params.id);

    res.json({
      message: "IQC deleted successfully",
    });
  } catch (error) {
    res.status(500).json({
      message: error.message,
    });
  }
});

// ======================================================
// REPAIR ROUTES
// ======================================================

app.get("/api/repair", async (req, res) => {
  try {
    const data = await Repair.find()
      .populate("caseId")
      .sort({
        createdAt: -1,
      });

    res.json(data);
  } catch (error) {
    res.status(500).json({
      message: error.message,
    });
  }
});

app.post("/api/repair", async (req, res) => {
  try {
    const repair = await Repair.create({
      caseId: req.body.caseId,
      replacementComponents:
        req.body.replacementComponents || [],
    });

    const result = await Repair.findById(
      repair._id
    ).populate("caseId");

    res.status(201).json(result);
  } catch (error) {
    res.status(500).json({
      message: error.message,
    });
  }
});

app.put(
  "/api/repair/:id",
  async (req, res) => {
    try {
      const data =
        await Repair.findByIdAndUpdate(
          req.params.id,
          {
            replacementComponents:
              req.body.replacementComponents ||
              [],
          },
          {
            new: true,
            runValidators: true,
          }
        ).populate("caseId");

      res.json(data);
    } catch (error) {
      res.status(500).json({
        message: error.message,
      });
    }
  }
);

app.delete(
  "/api/repair/:id",
  async (req, res) => {
    try {
      await Repair.findByIdAndDelete(
        req.params.id
      );

      res.json({
        message: "Repair deleted successfully",
      });
    } catch (error) {
      res.status(500).json({
        message: error.message,
      });
    }
  }
);

// ======================================================
// OQC ROUTES
// ======================================================

app.get("/api/oqc", async (req, res) => {
  try {
    const data = await OQC.find()
      .populate("caseId")
      .sort({
        createdAt: -1,
      });

    res.json(data);
  } catch (error) {
    res.status(500).json({
      message: error.message,
    });
  }
});

app.post("/api/oqc", async (req, res) => {
  try {
    const oqc = await OQC.create({
      caseId: req.body.caseId,
      testing: req.body.testing || [],
    });

    const result = await OQC.findById(
      oqc._id
    ).populate("caseId");

    res.status(201).json(result);
  } catch (error) {
    res.status(500).json({
      message: error.message,
    });
  }
});

app.put("/api/oqc/:id", async (req, res) => {
  try {
    const data = await OQC.findByIdAndUpdate(
      req.params.id,
      {
        testing: req.body.testing || [],
      },
      {
        new: true,
        runValidators: true,
      }
    ).populate("caseId");

    res.json(data);
  } catch (error) {
    res.status(500).json({
      message: error.message,
    });
  }
});

app.delete("/api/oqc/:id", async (req, res) => {
  try {
    await OQC.findByIdAndDelete(req.params.id);

    res.json({
      message: "OQC deleted successfully",
    });
  } catch (error) {
    res.status(500).json({
      message: error.message,
    });
  }
});

// ======================================================
// HOME
// ======================================================

app.get("/", (req, res) => {
  res.json({
    message: "Service Management API Running",
  });
});

// ======================================================
// SERVER
// ======================================================

app.listen(PORT, () => {
  console.log(
    `Backend running on http://localhost:${PORT}`
  );
});
