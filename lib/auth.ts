import { NextApiRequest } from 'next';
import jwt from 'jsonwebtoken';
const JWT_SECRET = process.env.JWT_SECRET!;

export function verifyToken(req: NextApiRequest) {
  const token = req.cookies.token;
  if (!token) return null;

  try {
    return jwt.verify(token, JWT_SECRET);
  } catch {
    return null;
  }
}
