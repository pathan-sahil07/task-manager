const jwt = require("jsonwebtoken");
const { PrismaClient } = require("@prisma/client");

const prisma = new PrismaClient();

/**
 * Verifies JWT and attaches user to req.user
 */
const authenticate = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return res.status(401).json({ error: "No token provided" });
    }

    const token = authHeader.split(" ")[1];
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    const user = await prisma.user.findUnique({
      where: { id: decoded.userId },
      select: { id: true, name: true, email: true, role: true },
    });

    if (!user) {
      return res.status(401).json({ error: "User not found" });
    }

    req.user = user;
    next();
  } catch (err) {
    if (err.name === "TokenExpiredError") {
      return res.status(401).json({ error: "Token expired" });
    }
    return res.status(401).json({ error: "Invalid token" });
  }
};

/**
 * Requires global ADMIN role
 */
const requireAdmin = (req, res, next) => {
  if (req.user?.role !== "ADMIN") {
    return res.status(403).json({ error: "Admin access required" });
  }
  next();
};

/**
 * Checks if the user is a member of the given project (param: projectId)
 * Attaches projectMember to req.projectMember
 */
const requireProjectAccess = async (req, res, next) => {
  try {
    const projectId = req.params.projectId || req.body.projectId || req.params.id;

    const member = await prisma.projectMember.findUnique({
      where: {
        projectId_userId: {
          projectId,
          userId: req.user.id,
        },
      },
    });

    if (!member && req.user.role !== "ADMIN") {
      return res.status(403).json({ error: "You are not a member of this project" });
    }

    req.projectMember = member;
    next();
  } catch (err) {
    next(err);
  }
};

/**
 * Requires project-level ADMIN role (or global ADMIN)
 */
const requireProjectAdmin = async (req, res, next) => {
  if (req.user.role === "ADMIN") return next();

  if (!req.projectMember || req.projectMember.role !== "ADMIN") {
    return res.status(403).json({ error: "Project admin access required" });
  }
  next();
};

module.exports = { authenticate, requireAdmin, requireProjectAccess, requireProjectAdmin };
