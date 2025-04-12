// const express = require("express");
// const http = require("http");
// const { Server } = require("socket.io");
// const cors = require("cors");
// require("dotenv").config();
// const db = require("./db");

// const app = express();
// const server = http.createServer(app);
// const io = new Server(server, {
//   cors: {
//     origin: "*",
//     methods: ["GET", "POST"],
//   },
// });

// // Middleware
// app.use(cors());
// app.use(express.json());

// // API lấy thông tin người dùng
// app.get("/users/:userId", async (req, res) => {
//   const { userId } = req.params;

//   try {
//     let userQuery = await db.query(
//       'SELECT name, profile_image_url FROM "user" WHERE id = $1',
//       [userId]
//     );
//     if (userQuery.rows.length > 0) {
//       return res.json({
//         id: userId,
//         name: userQuery.rows[0].name,
//         profileImageUrl: userQuery.rows[0].profile_image_url || "",
//         role: "user",
//       });
//     }

//     let driverQuery = await db.query(
//       "SELECT name, profile_image_url FROM driver WHERE id = $1",
//       [userId]
//     );
//     if (driverQuery.rows.length > 0) {
//       return res.json({
//         id: userId,
//         name: driverQuery.rows[0].name,
//         profileImageUrl: driverQuery.rows[0].profile_image_url || "",
//         role: "driver",
//       });
//     }

//     return res.status(404).json({ error: "User not found" });
//   } catch (error) {
//     console.error("Error fetching user:", error);
//     res.status(500).json({ error: "Internal server error" });
//   }
// });

// // API lấy danh sách phòng chat
// app.get("/chat-rooms/:userId", async (req, res) => {
//   const { userId } = req.params;

//   try {
//     console.log("Fetching chat rooms for userId:", userId);
//     const roomsQuery = await db.query(
//       `
//       SELECT mr.id, mr.user_id, mr.driver_id,
//              (SELECT m.message_text 
//               FROM messages m 
//               WHERE m.message_room_id = mr.id 
//               ORDER BY m.timestamp DESC 
//               LIMIT 1) as last_message,
//              (SELECT COUNT(*) 
//               FROM messages m 
//               WHERE m.message_room_id = mr.id 
//               AND m.sender_id != $1 
//               AND m.is_read = FALSE) as unread_count
//       FROM message_room mr
//       WHERE mr.user_id = $1 OR mr.driver_id = $1
//       `,
//       [userId]
//     );

//     console.log("Rooms query result:", roomsQuery.rows);

//     const chatRooms = await Promise.all(
//       roomsQuery.rows.map(async (room) => {
//         const otherUserId =
//           room.user_id === userId ? room.driver_id : room.user_id;
//         let otherUserName = "Unknown User";
//         let role = "user";

//         try {
//           if (room.user_id === userId) {
//             const driverQuery = await db.query(
//               "SELECT name FROM driver WHERE id = $1",
//               [otherUserId]
//             );
//             if (driverQuery.rows.length > 0) {
//               otherUserName = driverQuery.rows[0].name;
//               role = "driver";
//             }
//           } else {
//             const userQuery = await db.query(
//               'SELECT name FROM "user" WHERE id = $1',
//               [otherUserId]
//             );
//             if (userQuery.rows.length > 0) {
//               otherUserName = userQuery.rows[0].name;
//               role = "user";
//             }
//           }
//         } catch (error) {
//           console.error(`Error fetching name for ${otherUserId}:`, error);
//         }

//         return {
//           id: room.id,
//           user_id: room.user_id,
//           driver_id: room.driver_id,
//           otherUser: { id: otherUserId, name: otherUserName, role },
//           lastMessage: room.last_message || "No messages yet",
//           unreadCount: parseInt(room.unread_count, 10) || 0,
//         };
//       })
//     );

//     res.json(chatRooms);
//   } catch (error) {
//     console.error("Error fetching chat rooms:", error);
//     res.status(500).json({ error: "Internal server error" });
//   }
// });

// // API lấy danh sách tin nhắn
// app.get("/messages/:roomId", async (req, res) => {
//   const { roomId } = req.params;

//   try {
//     const messagesQuery = await db.query(
//       "SELECT id, sender_id, message_text, timestamp, is_read FROM messages WHERE message_room_id = $1 ORDER BY timestamp ASC",
//       [roomId]
//     );

//     const messages = messagesQuery.rows.map((msg) => ({
//       id: msg.id.toString(),
//       sender_id: msg.sender_id,
//       message_text: msg.message_text,
//       timestamp: new Date(msg.timestamp).toLocaleTimeString(),
//       is_read: msg.is_read,
//     }));

//     res.json(messages);
//   } catch (error) {
//     console.error("Error fetching messages:", error);
//     res.status(500).json({ error: "Internal server error" });
//   }
// });

// // API đánh dấu tin nhắn là đã đọc
// app.post("/messages/mark-as-read/:roomId/:userId", async (req, res) => {
//   const { roomId, userId } = req.params;

//   try {
//     // Chỉ đánh dấu tin nhắn từ người gửi khác (không phải userId) là đã đọc
//     await db.query(
//       "UPDATE messages SET is_read = TRUE WHERE message_room_id = $1 AND sender_id != $2 AND is_read = FALSE",
//       [roomId, userId]
//     );
//     res.json({ success: true });
//   } catch (error) {
//     console.error("Error marking messages as read:", error);
//     res.status(500).json({ error: "Internal server error" });
//   }
// });

// // API kiểm tra kết nối database
// app.get("/test-db", async (req, res) => {
//   try {
//     const result = await db.query("SELECT NOW()");
//     res.json({ success: true, time: result.rows[0].now });
//   } catch (error) {
//     console.error("Database connection test failed:", error);
//     res.status(500).json({ success: false, error: error.message });
//   }
// });

// // WebSocket
// io.on("connection", (socket) => {
//   console.log("A user connected:", socket.id);

//   socket.on("joinRoom", (roomId) => {
//     socket.join(roomId);
//     console.log(`User ${socket.id} joined room ${roomId}`);
//   });

//   socket.on("sendMessage", async ({ roomId, message }) => {
//     try {
//       console.log("Received sendMessage:", { roomId, message });
//       const result = await db.query(
//         "INSERT INTO messages (sender_id, message_room_id, message_text, timestamp, is_read) VALUES ($1, $2, $3, NOW(), FALSE) RETURNING id, timestamp",
//         [message.sender_id, roomId, message.message_text]
//       );

//       const savedMessage = {
//         id: result.rows[0].id.toString(),
//         sender_id: message.sender_id,
//         message_text: message.message_text,
//         timestamp: new Date(result.rows[0].timestamp).toLocaleTimeString(),
//         is_read: false,
//       };

//       console.log("Emitting message to room:", roomId, savedMessage);
//       io.to(roomId).emit("message", savedMessage);

//       // Cập nhật lastMessage và unreadCount
//       const unreadCountQuery = await db.query(
//         "SELECT COUNT(*) FROM messages WHERE message_room_id = $1 AND sender_id != $2 AND is_read = FALSE",
//         [roomId, message.sender_id]
//       );
//       const unreadCount = parseInt(unreadCountQuery.rows[0].count, 10) || 0;

//       io.to(roomId).emit("updateLastMessage", {
//         roomId,
//         lastMessage: savedMessage.message_text,
//         unreadCount,
//       });
//     } catch (error) {
//       console.error("Error saving message:", error);
//     }
//   });

//   socket.on("typing", ({ roomId, userId }) => {
//     socket.to(roomId).emit("typing", { roomId, userId });
//   });

//   socket.on("stopTyping", ({ roomId, userId }) => {
//     socket.to(roomId).emit("stopTyping", { roomId, userId });
//   });

//   socket.on("updateUnreadCount", async ({ roomId, userId }) => {
//     try {
//       const unreadCountQuery = await db.query(
//         "SELECT COUNT(*) FROM messages WHERE message_room_id = $1 AND sender_id != $2 AND is_read = FALSE",
//         [roomId, userId]
//       );
//       const unreadCount = parseInt(unreadCountQuery.rows[0].count, 10) || 0;

//       io.to(roomId).emit("updateLastMessage", {
//         roomId,
//         lastMessage: null,
//         unreadCount,
//       });
//     } catch (error) {
//       console.error("Error updating unread count:", error);
//     }
//   });

//   socket.on("disconnect", () => {
//     console.log("User disconnected:", socket.id);
//   });
// });

// const PORT = process.env.PORT || 3000;
// server.listen(PORT, () => {
//   console.log(`Server running on port ${PORT}`);
// });
// chat-backend/server.js
const express = require("express");
const http = require("http");
const { Server } = require("socket.io");
const cors = require("cors");
require("dotenv").config();
const db = require("./db");

const app = express();
const server = http.createServer(app);

// Cấu hình CORS cho socket.io
const io = new Server(server, {
  cors: {
    origin: "*", // Cho phép tất cả origin (sẽ cập nhật sau khi có URL frontend)
    methods: ["GET", "POST"],
    credentials: true,
  },
});

// Middleware CORS cho Express
app.use(
  cors({
    origin: "*", // Cho phép tất cả origin (sẽ cập nhật sau khi có URL frontend)
    methods: ["GET", "POST", "PUT", "DELETE"],
    credentials: true,
  })
);

app.use(express.json());

// API lấy thông tin người dùng
app.get("/users/:userId", async (req, res) => {
  const { userId } = req.params;

  try {
    console.log("Fetching user with ID:", userId);
    let userQuery = await db.query(
      'SELECT name, profile_image_url FROM "user" WHERE id = $1',
      [userId]
    );
    console.log("User query result:", userQuery.rows);
    if (userQuery.rows.length > 0) {
      return res.json({
        id: userId,
        name: userQuery.rows[0].name,
        profileImageUrl: userQuery.rows[0].profile_image_url || "",
        role: "user",
      });
    }

    let driverQuery = await db.query(
      "SELECT name, profile_image_url FROM driver WHERE id = $1",
      [userId]
    );
    console.log("Driver query result:", driverQuery.rows);
    if (driverQuery.rows.length > 0) {
      return res.json({
        id: userId,
        name: driverQuery.rows[0].name,
        profileImageUrl: driverQuery.rows[0].profile_image_url || "",
        role: "driver",
      });
    }

    return res.status(404).json({ error: "User not found" });
  } catch (error) {
    console.error("Error fetching user:", error);
    res.status(500).json({ error: "Internal server error", details: error.message });
  }
});

// API lấy danh sách phòng chat
app.get("/chat-rooms/:userId", async (req, res) => {
  const { userId } = req.params;

  try {
    console.log("Fetching chat rooms for userId:", userId);
    const roomsQuery = await db.query(
      `
      SELECT mr.id, mr.user_id, mr.driver_id,
             (SELECT m.message_text 
              FROM messages m 
              WHERE m.message_room_id = mr.id 
              ORDER BY m.timestamp DESC 
              LIMIT 1) as last_message,
             (SELECT COUNT(*) 
              FROM messages m 
              WHERE m.message_room_id = mr.id 
              AND m.sender_id != $1 
              AND m.is_read = FALSE) as unread_count
      FROM message_room mr
      WHERE mr.user_id = $1 OR mr.driver_id = $1
      `,
      [userId]
    );

    console.log("Rooms query result:", roomsQuery.rows);

    const chatRooms = await Promise.all(
      roomsQuery.rows.map(async (room) => {
        const otherUserId =
          room.user_id === userId ? room.driver_id : room.user_id;
        let otherUserName = "Unknown User";
        let role = "user";
        let profileImageUrl = "";

        try {
          if (room.user_id === userId) {
            const driverQuery = await db.query(
              "SELECT name, profile_image_url FROM driver WHERE id = $1",
              [otherUserId]
            );
            if (driverQuery.rows.length > 0) {
              otherUserName = driverQuery.rows[0].name;
              profileImageUrl = driverQuery.rows[0].profile_image_url || "";
              role = "driver";
            }
          } else {
            const userQuery = await db.query(
              'SELECT name, profile_image_url FROM "user" WHERE id = $1',
              [otherUserId]
            );
            if (userQuery.rows.length > 0) {
              otherUserName = userQuery.rows[0].name;
              profileImageUrl = userQuery.rows[0].profile_image_url || "";
              role = "user";
            }
          }
        } catch (error) {
          console.error(`Error fetching name for ${otherUserId}:`, error);
        }

        return {
          id: room.id,
          user_id: room.user_id,
          driver_id: room.driver_id,
          otherUser: { id: otherUserId, name: otherUserName, role, profileImageUrl },
          lastMessage: room.last_message || "No messages yet",
          unreadCount: parseInt(room.unread_count, 10) || 0,
        };
      })
    );

    res.json(chatRooms);
  } catch (error) {
    console.error("Error fetching chat rooms:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

// API lấy danh sách tin nhắn
app.get("/messages/:roomId", async (req, res) => {
  const { roomId } = req.params;

  try {
    const messagesQuery = await db.query(
      "SELECT id, sender_id, message_text, timestamp, is_read FROM messages WHERE message_room_id = $1 ORDER BY timestamp ASC",
      [roomId]
    );

    const messages = messagesQuery.rows.map((msg) => ({
      id: msg.id.toString(),
      sender_id: msg.sender_id,
      message_text: msg.message_text,
      timestamp: new Date(msg.timestamp).toLocaleTimeString(),
      is_read: msg.is_read,
    }));

    res.json(messages);
  } catch (error) {
    console.error("Error fetching messages:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

// API đánh dấu tin nhắn là đã đọc
app.post("/messages/mark-as-read/:roomId/:userId", async (req, res) => {
  const { roomId, userId } = req.params;

  try {
    const result = await db.query(
      "UPDATE messages SET is_read = TRUE WHERE message_room_id = $1 AND sender_id != $2 AND is_read = FALSE RETURNING *",
      [roomId, userId]
    );

    const updatedMessages = result.rows.map((msg) => ({
      id: msg.id.toString(),
      sender_id: msg.sender_id,
      message_text: msg.message_text,
      timestamp: new Date(msg.timestamp).toLocaleTimeString(),
      is_read: msg.is_read,
    }));

    io.to(roomId).emit("messagesRead", updatedMessages);

    res.json({ success: true });
  } catch (error) {
    console.error("Error marking messages as read:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

// WebSocket
io.on("connection", (socket) => {
  console.log("A user connected:", socket.id);

  socket.on("joinRoom", (roomId) => {
    socket.join(roomId);
    console.log(`User ${socket.id} joined room ${roomId}`);
  });

  socket.on("sendMessage", async ({ roomId, message }) => {
    try {
      console.log("Received sendMessage:", { roomId, message });
      const result = await db.query(
        "INSERT INTO messages (sender_id, message_room_id, message_text, timestamp, is_read) VALUES ($1, $2, $3, NOW(), FALSE) RETURNING id, timestamp",
        [message.sender_id, roomId, message.message_text]
      );

      const savedMessage = {
        id: result.rows[0].id.toString(),
        sender_id: message.sender_id,
        message_text: message.message_text,
        timestamp: new Date(result.rows[0].timestamp).toLocaleTimeString(),
        is_read: false,
      };

      // Gửi tin nhắn đến tất cả client trong room
      io.to(roomId).emit("message", savedMessage);

      // Cập nhật lastMessage và unreadCount cho tất cả client
      const roomQuery = await db.query(
        "SELECT user_id, driver_id FROM message_room WHERE id = $1",
        [roomId]
      );
      
      if (roomQuery.rows.length > 0) {
        const { user_id, driver_id } = roomQuery.rows[0];
        const otherUserId = message.sender_id === user_id ? driver_id : user_id;

        const unreadCountQuery = await db.query(
          "SELECT COUNT(*) FROM messages WHERE message_room_id = $1 AND sender_id != $2 AND is_read = FALSE",
          [roomId, otherUserId]
        );
        const unreadCount = parseInt(unreadCountQuery.rows[0].count, 10) || 0;

        // Gửi sự kiện updateLastMessage đến tất cả client trong room
        io.to(roomId).emit("updateLastMessage", {
          roomId,
          lastMessage: savedMessage.message_text,
          unreadCount,
        });
      }
    } catch (error) {
      console.error("Error saving message:", error);
    }
  });

  socket.on("typing", ({ roomId, userId }) => {
    socket.to(roomId).emit("typing", { roomId, userId });
  });

  socket.on("stopTyping", ({ roomId, userId }) => {
    socket.to(roomId).emit("stopTyping", { roomId, userId });
  });

  socket.on("updateUnreadCount", async ({ roomId, userId }) => {
    try {
      const unreadCountQuery = await db.query(
        "SELECT COUNT(*) FROM messages WHERE message_room_id = $1 AND sender_id != $2 AND is_read = FALSE",
        [roomId, userId]
      );
      const unreadCount = parseInt(unreadCountQuery.rows[0].count, 10) || 0;

      io.to(roomId).emit("updateLastMessage", {
        roomId,
        lastMessage: null,
        unreadCount,
      });
    } catch (error) {
      console.error("Error updating unread count:", error);
    }
  });

  socket.on("disconnect", () => {
    console.log("User disconnected:", socket.id);
  });
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, "0.0.0.0", () => {
  console.log(`Server running on port ${PORT}`);
});