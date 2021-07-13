//script.js contains the client side code 
const socket = io("/");
const videoGrid = document.getElementById("video-grid");
const myVideo = document.createElement("video");
const showChat = document.querySelector("#showChat");
const backButton = document.querySelector(".header__back");
myVideo.muted = true;

backButton.addEventListener("click", () => {       
  document.querySelector(".main__left").style.display = "flex";
  document.querySelector(".main__left").style.flex = "1";
  document.querySelector(".main__right").style.display = "none";
  document.querySelector(".header__back").style.display = "none";
});

showChat.addEventListener("click", () => {   
  document.querySelector(".main__right").style.display = "flex";
  document.querySelector(".main__right").style.flex = "1";
  document.querySelector(".main__left").style.display = "none";
  document.querySelector(".header__back").style.display = "block";
});

const user = prompt("Enter your name to join the call room");

var peer = new Peer();
const peers = {}
let myVideoStream; // The code below handles the access to media input devices like cameras and microphones 
let userVideoStream;
navigator.mediaDevices
  .getUserMedia({
    audio: true,
    video: true,
  })
  .then((stream) => {
    myVideoStream = stream;
    joinVideoStream(myVideo, stream);

    peer.on("call", (call) => {  //this will allow the user to join the video stream
      call.answer(stream);
      const video = document.createElement("video");
      call.on("stream", (userVideoStream) => {
        joinVideoStream(video, userVideoStream);
      });
    });

    socket.on("user-connected", (userId) => { //this will add other users to the video call with video stream 
      connectToNewUser(userId, stream);
    });
  });

const connectToNewUser = (userId, stream) => {  //this function will add a video stream to other users joining
  const call = peer.call(userId, stream);
  const video = document.createElement("video");
  call.on("stream", (userVideoStream) => {
    
    joinVideoStream(video, userVideoStream);
  });
};
socket.on('user-disconnected', userId => {
  if (peers[userId]) peers[userId].close()
})
peer.on("open", (id) => {
  socket.emit("join-room", ROOM_ID, id, user);
});

const joinVideoStream = (video, stream) => {  //this function will add a video stream to the video element
  video.srcObject = stream;
  video.addEventListener("loadedmetadata", () => {
    video.play();
    videoGrid.append(video);
  });
};

let text = document.querySelector("#chat_message"); // this part of the code handles the chat section of the app
let send = document.getElementById("send");
let messages = document.querySelector(".messages");

send.addEventListener("click", (e) => {
  if (text.value.length !== 0) {
    socket.emit("message", text.value);
    text.value = "";
  }
});

text.addEventListener("keydown", (e) => {
  if (e.key === "Enter" && text.value.length !== 0) {
    socket.emit("message", text.value);
    text.value = "";
  }
});

const inviteButton = document.querySelector("#inviteButton"); 
const muteAudioButton = document.querySelector("#muteButton");
const stopVideoButton = document.querySelector("#stopVideo");
muteAudioButton.addEventListener("click", () => {  //handles the muting and unmuting of audio
  const enabled = myVideoStream.getAudioTracks()[0].enabled;
  if (enabled) {
    myVideoStream.getAudioTracks()[0].enabled = false;
    html = `<i class="fas fa-microphone-slash"></i>`;
    muteAudioButton.classList.toggle("background__red");
    muteAudioButton.innerHTML = html;
  } else {
    myVideoStream.getAudioTracks()[0].enabled = true;
    html = `<i class="fas fa-microphone"></i>`;
    muteAudioButton.classList.toggle("background__red");
    muteAudioButton.innerHTML = html;
  }
});

stopVideoButton.addEventListener("click", () => {   //handles the pausing and resuming of videocam
  const enabled = myVideoStream.getVideoTracks()[0].enabled;
  if (enabled) {
    myVideoStream.getVideoTracks()[0].enabled = false;
    html = `<i class="fas fa-video-slash"></i>`;
    stopVideoButton.classList.toggle("background__red");
    stopVideoButton.innerHTML = html;
  } else {
    myVideoStream.getVideoTracks()[0].enabled = true;
    html = `<i class="fas fa-video"></i>`;
    stopVideoButton.classList.toggle("background__red");
    stopVideoButton.innerHTML = html;
  }
});

inviteButton.addEventListener("click", (e) => {   //handles the invite button and displays a link to be shared for other people to join the call
  prompt(
    "Copy this link and send it to people you want to join this meet",
    window.location.href
  );
});


socket.on("createMessage", (message, userName) => { //sends and displays the message along with the name of sender
  messages.innerHTML =
    messages.innerHTML +
    `<div class="message">
        <b><i class="far fa-user-circle"></i> <span> ${
          userName === user ? "me" : userName
        }</span> </b>
        <span>${message}</span>
    </div>`;
});