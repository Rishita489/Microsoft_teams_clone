//server.js contains the server side code 
const express = require("express");//creating server using express 
const app = express();
const server = require("http").Server(app);
const { v4: uuidv4 } = require("uuid");//create a  random unique URL for each room
app.set("view engine", "ejs");
const io = require("socket.io")(server, {
  cors: {
    origin: '*'
  },
});
app.use(express.static("public"));//allow access to server.js
const { ExpressPeerServer } = require("peer");
const peerServer = ExpressPeerServer(server, {
  debug: true,
});

app.use("/peerjs", peerServer);
app.use(express.static("public"));

app.get("/", (request, response) => {  //Redirecting user to the room
  response.redirect(`/${uuidv4()}`);
});

app.get("/:room", (request, response) => {       //adding view for every unique room and passing URL to that view
  response.render("room", { roomId: request.params.room });
});

io.on("connection", (socket) => {                             //socket.io for establishing connection for video calling 
  socket.on("join-room", (roomId, userId, userName) => {
    socket.join(roomId);
    socket.to(roomId).broadcast.emit("user-connected", userId); //this function handles the situation when a user connects and when a user disconnects
    socket.on('disconnect', () => {                              
      socket.to(roomId).broadcast.emit('user-disconnected', userId)
    })
    socket.on("message", (message) => {                          // the function will be called when  socket connected to the server emits a 'message' event:
      io.to(roomId).emit("createMessage", message, userName);
    });
  });
});

server.listen(process.env.PORT || 3030); //the app will run on localhost:3000