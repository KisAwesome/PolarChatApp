const socket = io();

socket.on('connect', () => {
  socket.emit('whoami', (username) => {
    console.log(username)
  })
})
socket.onAny((event, ...args) => {
    console.log(event, args);
  });

