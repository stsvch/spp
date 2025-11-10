import { Router } from "express";
import jwt from "jsonwebtoken";
import { resolvers } from "./resolvers.js";

const router = Router();

router.post("/", async (req, res) => {
  const { query, variables = {}, operationName } = req.body || {};
  if (typeof query !== "string") {
    return res.status(400).json({ errors: [{ message: "Query must be a string" }] });
  }

  const trimmed = query.trim();
  const typeMatch = trimmed.match(/^(mutation|query)\b/i);
  const operationType = typeMatch ? typeMatch[1].toLowerCase() : "query";
  const nameFromQuery = trimmed.match(/^(?:mutation|query)\s+([A-Za-z0-9_]+)/i)?.[1] || null;
  const fieldMatch = trimmed.match(/\{\s*([A-Za-z0-9_]+)/);
  const rootField = fieldMatch ? fieldMatch[1] : null;
  const opName = operationName || nameFromQuery || rootField;

  const resolverMap = operationType === "mutation" ? resolvers.Mutation : resolvers.Query;
  const field = rootField && resolverMap[rootField] ? rootField : opName;
  const resolver = field ? resolverMap[field] : null;

  if (!resolver) {
    return res.json({ errors: [{ message: `Unknown operation ${opName || rootField || ""}` }] });
  }

  const context = createContext(req, res);
  try {
    const result = await resolver(null, variables || {}, context);
    const key = rootField || opName || (operationType === "mutation" ? Object.keys(resolverMap)[0] : "");
    return res.json({ data: { [key]: result } });
  } catch (err) {
    const message = err?.message || "Internal error";
    const payload = { message };
    if (err?.extensions) payload.extensions = err.extensions;
    return res.json({ errors: [payload] });
  }
});

router.get("/", (_req, res) => {
  res.status(405).json({ errors: [{ message: "Method not allowed" }] });
});

function createContext(req, res) {
  let user = null;
  const hdr = req.headers.authorization || "";
  const [, token] = hdr.split(" ");
  if (token) {
    try {
      const payload = jwt.verify(token, process.env.ACCESS_TOKEN_SECRET);
      user = { id: payload.sub, role: payload.role };
    } catch {}
  }
  return { req, res, user };
}

export default router;
