const { io } = require("socket.io-client");

// Live URL & Path configuration

const socket = io("https://trade.tradestreet.in/", {

    path: "/backend/socket.io",

    transports: ["polling", "websocket"],

    reconnection: true,

    rejectUnauthorized: false,

});

socket.on("connect", () => {

    console.log(":green_circle: Connected to live Socket.IO");

    // Room join karein taaki updates aane lagein

    socket.emit("join_plan", "Basic");

});

socket.on("receive_data_forex", (payload) => {

    console.log("dddddddddddddddddddddddddddddddddddddddddddddddddd", payload);

    if (payload && payload.data) {

        const { ticker, Mid_Price } = payload.data;

    }

});

socket.on("connect_error", (err) => {

    console.log(":cross_mark: Connect Error:", err.message);

});

socket.on("disconnect", (reason) => {

    console.log(":red_circle: Disconnected:", reason);

});