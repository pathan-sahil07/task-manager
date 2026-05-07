const express = require("express");
const { body, query, validationResult } = require("express-validator");
const { PrismaClient } = require("@prisma/client");
const {
  authenticate,
  requireProjectAccess,
  requireProjectAdmin,
} = require("../middleware/auth");

const router = express.Router();
const prisma = new PrismaClient();

// GET /api/tasks — get tasks for the current user (dashboard)
router.get("/my", authenticate, async (req, res, next) => {
  try {
    const tasks = await prisma.task.findMany({
      where: { assigneeId: req.user.id },
      include: {
        project: { select: { id: true, name: true } },
        creator: { select: { id: true, name: true } },
      },
      orderBy: { updatedAt: "desc" },
    });
    res.json(tasks);
  } catch (err) {
    next(err);
  }
});

// GET /api/tasks/dashboard — summary stats
router.get("/dashboard", authenticate, async (req, res, next) => {
  try {
    const isAdmin = req.user.role === "ADMIN";
    const filter = isAdmin ? {} : { assigneeId: req.user.id };
    const now = new Date();

    const [total, byStatus, overdue, recentTasks] = await Promise.all([
      prisma.task.count({ where: filter }),
      prisma.task.groupBy({
        by: ["status"],
        where: filter,
        _count: { status: true },
      }),
      prisma.task.count({
        where: {
          ...filter,
          dueDate: { lt: now },
          status: { not: "DONE" },
        },
      }),
      prisma.task.findMany({
        where: filter,
        include: {
          project: { select: { id: true, name: true } },
          assignee: { select: { id: true, name: true } },
        },
        orderBy: { updatedAt: "desc" },
        take: 5,
      }),
    ]);

    const statusMap = byStatus.reduce((acc, s) => {
      acc[s.status] = s._count.status;
      return acc;
    }, {});

    res.json({
      total,
      todo: statusMap.TODO || 0,
      inProgress: statusMap.IN_PROGRESS || 0,
      inReview: statusMap.IN_REVIEW || 0,
      done: statusMap.DONE || 0,
      overdue,
      recentTasks,
    });
  } catch (err) {
    next(err);
  }
});

// GET /api/tasks/project/:projectId — get tasks for a project
router.get(
  "/project/:projectId",
  authenticate,
  requireProjectAccess,
  async (req, res, next) => {
    try {
      const { status, priority, assigneeId } = req.query;
      const where = { projectId: req.params.projectId };
      if (status) where.status = status;
      if (priority) where.priority = priority;
      if (assigneeId) where.assigneeId = assigneeId;

      const tasks = await prisma.task.findMany({
        where,
        include: {
          assignee: { select: { id: true, name: true, email: true } },
          creator: { select: { id: true, name: true } },
        },
        orderBy: { createdAt: "desc" },
      });
      res.json(tasks);
    } catch (err) {
      next(err);
    }
  }
);

// POST /api/tasks — create task (project admin only)
router.post(
  "/",
  authenticate,
  [
    body("title").trim().notEmpty().withMessage("Task title is required"),
    body("projectId").notEmpty().withMessage("projectId is required"),
    body("status")
      .optional()
      .isIn(["TODO", "IN_PROGRESS", "IN_REVIEW", "DONE"]),
    body("priority")
      .optional()
      .isIn(["LOW", "MEDIUM", "HIGH", "URGENT"]),
    body("dueDate").optional().isISO8601().toDate(),
  ],
  async (req, res, next) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) return res.status(422).json({ errors: errors.array() });

      const { title, description, projectId, assigneeId, status, priority, dueDate } = req.body;

      // Check project membership & admin role
      const member = await prisma.projectMember.findUnique({
        where: { projectId_userId: { projectId, userId: req.user.id } },
      });

      if (!member && req.user.role !== "ADMIN") {
        return res.status(403).json({ error: "Not a project member" });
      }
      if (member?.role !== "ADMIN" && req.user.role !== "ADMIN") {
        return res.status(403).json({ error: "Only project admins can create tasks" });
      }

      const task = await prisma.task.create({
        data: {
          title,
          description,
          projectId,
          assigneeId: assigneeId || null,
          creatorId: req.user.id,
          status: status || "TODO",
          priority: priority || "MEDIUM",
          dueDate: dueDate || null,
        },
        include: {
          assignee: { select: { id: true, name: true, email: true } },
          creator: { select: { id: true, name: true } },
          project: { select: { id: true, name: true } },
        },
      });

      res.status(201).json(task);
    } catch (err) {
      next(err);
    }
  }
);

// GET /api/tasks/:id
router.get("/:id", authenticate, async (req, res, next) => {
  try {
    const task = await prisma.task.findUnique({
      where: { id: req.params.id },
      include: {
        assignee: { select: { id: true, name: true, email: true } },
        creator: { select: { id: true, name: true } },
        project: { select: { id: true, name: true } },
      },
    });
    if (!task) return res.status(404).json({ error: "Task not found" });

    // Check access: must be project member or assignee
    const member = await prisma.projectMember.findUnique({
      where: { projectId_userId: { projectId: task.projectId, userId: req.user.id } },
    });

    if (!member && req.user.role !== "ADMIN") {
      return res.status(403).json({ error: "Access denied" });
    }

    res.json(task);
  } catch (err) {
    next(err);
  }
});

// PUT /api/tasks/:id — update task
// Admins can update everything; members can only update status of assigned tasks
router.put(
  "/:id",
  authenticate,
  [
    body("title").optional().trim().notEmpty(),
    body("status").optional().isIn(["TODO", "IN_PROGRESS", "IN_REVIEW", "DONE"]),
    body("priority").optional().isIn(["LOW", "MEDIUM", "HIGH", "URGENT"]),
    body("dueDate").optional().isISO8601().toDate(),
  ],
  async (req, res, next) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) return res.status(422).json({ errors: errors.array() });

      const task = await prisma.task.findUnique({ where: { id: req.params.id } });
      if (!task) return res.status(404).json({ error: "Task not found" });

      const member = await prisma.projectMember.findUnique({
        where: { projectId_userId: { projectId: task.projectId, userId: req.user.id } },
      });

      if (!member && req.user.role !== "ADMIN") {
        return res.status(403).json({ error: "Access denied" });
      }

      const isProjectAdmin = member?.role === "ADMIN" || req.user.role === "ADMIN";
      const isAssignee = task.assigneeId === req.user.id;

      if (!isProjectAdmin && !isAssignee) {
        return res.status(403).json({ error: "Only assigned user or admin can update this task" });
      }

      // Members can only update status; admins can update everything
      let updateData = {};
      if (isProjectAdmin) {
        const { title, description, assigneeId, status, priority, dueDate } = req.body;
        updateData = {
          ...(title && { title }),
          ...(description !== undefined && { description }),
          ...(assigneeId !== undefined && { assigneeId }),
          ...(status && { status }),
          ...(priority && { priority }),
          ...(dueDate !== undefined && { dueDate }),
        };
      } else {
        // Member: only status
        if (req.body.status) updateData.status = req.body.status;
      }

      const updated = await prisma.task.update({
        where: { id: req.params.id },
        data: updateData,
        include: {
          assignee: { select: { id: true, name: true, email: true } },
          creator: { select: { id: true, name: true } },
          project: { select: { id: true, name: true } },
        },
      });

      res.json(updated);
    } catch (err) {
      next(err);
    }
  }
);

// DELETE /api/tasks/:id — delete task (project admin only)
router.delete("/:id", authenticate, async (req, res, next) => {
  try {
    const task = await prisma.task.findUnique({ where: { id: req.params.id } });
    if (!task) return res.status(404).json({ error: "Task not found" });

    const member = await prisma.projectMember.findUnique({
      where: { projectId_userId: { projectId: task.projectId, userId: req.user.id } },
    });

    if (member?.role !== "ADMIN" && req.user.role !== "ADMIN") {
      return res.status(403).json({ error: "Only project admins can delete tasks" });
    }

    await prisma.task.delete({ where: { id: req.params.id } });
    res.json({ message: "Task deleted" });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
