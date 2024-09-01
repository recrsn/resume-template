(function () {
  const ws = new WebSocket(
    "ws://localhost:${server.address().port}/livereload",
  );
  ws.onmessage = (event) => {
    if (event.data === "reload") {
      location.reload();
    }
  };
  ws.onopen = () => {
    console.log("LiveReload connected");
  };
  ws.onclose = () => {
    console.log("LiveReload disconnected");
  };
  ws.onerror = (error) => {
    console.error("LiveReload error:", error);
  };
  window.addEventListener("beforeunload", () => {
    ws.close();
  });
})(); // livereload.js
