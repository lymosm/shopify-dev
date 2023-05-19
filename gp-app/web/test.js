// const http = require("http");
import http from "http";
const server = http.createServer((req, res) => {
    console.log(process.env);
});
server.listen(3030, () => {
    console.log("localhost:3030");
});