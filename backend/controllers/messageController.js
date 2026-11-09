import Message from "../models/Message.js";
import asyncHandler from "../utils/asyncHandler.js";
import pick from "../utils/pick.js";
import { notifyNewMessage } from "../utils/mailer.js";

export const createMessage = asyncHandler(async (req, res) => {
  const data = pick(req.body, ["name", "email", "subject", "message"]);

  // honeypot: bots fill hidden fields, humans don't
  if (req.body.website) {
    return res.status(201).json({ message: "Message sent" });
  }

  const saved = await Message.create(data);
  notifyNewMessage(saved);
  res.status(201).json({ message: "Message sent" });
});

export const getMessages = asyncHandler(async (req, res) => {
  const messages = await Message.find().sort({ createdAt: -1 });
  res.json(messages);
});

export const markRead = asyncHandler(async (req, res) => {
  const message = await Message.findByIdAndUpdate(
    req.params.id,
    { read: true },
    { new: true }
  );
  if (!message) {
    res.status(404);
    throw new Error("Message not found");
  }
  res.json(message);
});

export const deleteMessage = asyncHandler(async (req, res) => {
  const message = await Message.findByIdAndDelete(req.params.id);
  if (!message) {
    res.status(404);
    throw new Error("Message not found");
  }
  res.json({ message: "Message deleted" });
});