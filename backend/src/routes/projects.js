const express = require("express");
const { body, validationResult } = require("express-validator");
const { PrismaClient } = require("@prisma/client");
const {
  authenticate,
  requireProjectAccess,
  requireProjectAdmin,
} = require("../middleware/auth");

const router = express.Router();
const prisma = new PrismaClient();

// GET /api/projects — list projects the user belongs to
router.get("/", authenticate, async (req, res, next) => {
  try {
    const isAdmin = req.user.role === "ADMIN";

    const projects = isAdmin
      ? await prisma.project.findMany({
          include: {
            owner: { select: { id: true, name: true, email: true } },
            _count: { select: { tasks: true, members: true } },
          },
          orderBy: { createdAt: "desc" },
        })
      : await prisma.project.findMany({
          where: {
            members: { some: { userId: req.user.id } },
          },
          include: {
            owner: { select: { id: true, name: true, email: true } },
            _count: { select: { tasks: true, members: true } },
          },
          orderBy: { createdAt: "desc" },
        });

    res.json(projects);
  } catch (err) {
    next(err);
  }
});

// POST /api/projects — create project (any authenticated user)
router.post(
  "/",
  authenticate,
  [
    body("name").trim().notEmpty().withMessage("Project name is required"),
    body("description").optional().trim(),
  ],
  async (req, res, next) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) return res.status(422).json({ errors: errors.array() });

      const { name, description } = req.body;

      const project = await prisma.project.create({
        data: {
          name,
          description,
          ownerId: req.user.id,
          members: {
            create: { userId: req.user.id, role: "ADMIN" },
          },
        },
        include: {
          owner: { select: { id: true, name: true, email: true } },
          _count: { select: { tasks: true, members: true } },
        },
      });

      res.status(201).json(project);
    } catch (err) {
      next(err);
    }
  }
);

// GET /api/projects/:id
router.get("/:id", authenticate, requireProjectAccess, async (req, res, next) => {
  try {
    const project = await prisma.project.findUnique({
      where: { id: req.params.id },
      include: {
        owner: { select: { id: true, name: true, email: true } },
        members: {
          include: {
            user: { select: { id: true, name: true, email: true, role: true } },
          },
        },
        tasks: {
          include: {
            assignee: { select: { id: true, name: true, email: true } },
            creator: { select: { id: true, name: true } },
          },
          orderBy: { createdAt: "desc" },
        },
      },
    });
    if (!project) return res.status(404).json({ error: "Project not found" });
    res.json(project);
  } catch (err) {
    next(err);
  }
});

// PUT /api/projects/:id — update project (project admin only)
router.put(
  "/:id",
  authenticate,
  requireProjectAccess,
  requireProjectAdmin,
  [
    body("name").optional().trim().notEmpty().withMessage("Name cannot be empty"),
    body("description").optional().trim(),
  ],
  async (req, res, next) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) return res.status(422).json({ errors: errors.array() });

      const { name, description } = req.body;
      const project = await prisma.project.update({
        where: { id: req.params.id },
        data: { ...(name && { name }), ...(description !== undefined && { description }) },
        include: {
          owner: { select: { id: true, name: true, email: true } },
          _count: { select: { tasks: true, members: true } },
        },
      });
      res.json(project);
    } catch (err) {
      next(err);
    }
  }
);

// DELETE /api/projects/:id — delete project (project admin only)
router.delete(
  "/:id",
  authenticate,
  requireProjectAccess,
  requireProjectAdmin,
  async (req, res, next) => {
    try {
      await prisma.project.delete({ where: { id: req.params.id } });
      res.json({ message: "Project deleted successfully" });
    } catch (err) {
      next(err);
    }
  }
);

// POST /api/projects/:id/members — add member to project
router.post(
  "/:id/members",
  authenticate,
  requireProjectAccess,
  requireProjectAdmin,
  [
    body("userId").notEmpty().withMessage("userId is required"),
    body("role").optional().isIn(["ADMIN", "MEMBER"]),
  ],
  async (req, res, next) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) return res.status(422).json({ errors: errors.array() });

      const { userId, role = "MEMBER" } = req.body;

      const userExists = await prisma.user.findUnique({ where: { id: userId } });
      if (!userExists) return res.status(404).json({ error: "User not found" });

      const member = await prisma.projectMember.upsert({
        where: { projectId_userId: { projectId: req.params.id, userId } },
        update: { role },
        create: { projectId: req.params.id, userId, role },
        include: {
          user: { select: { id: true, name: true, email: true } },
        },
      });

      res.status(201).json(member);
    } catch (err) {
      next(err);
    }
  }
);

// DELETE /api/projects/:id/members/:userId — remove member
router.delete(
  "/:id/members/:userId",
  authenticate,
  requireProjectAccess,
  requireProjectAdmin,
  async (req, res, next) => {
    try {
      await prisma.projectMember.delete({
        where: {
          projectId_userId: {
            projectId: req.params.id,
            userId: req.params.userId,
          },
        },
      });
      res.json({ message: "Member removed" });
    } catch (err) {
      next(err);
    }
  }
);

module.exports = router;
