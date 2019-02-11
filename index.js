var static = require("node-static");
let store = require("./store.json");
let fs = require("fs");

var fileServer = new static.Server({
  rootPath: ".",
  noCache: true
});
function whileServing(evt) {
  if (evt) {
    console.log(`served a page ${evt}`);
    console.log(store.counter++);
    fs.writeFile("store.json", JSON.stringify(store), "utf8", () => {
      console.log(`new state: ${store.counter}`);
    });
  }
}

const server = require("http").createServer(function(request, response) {
  request
    .addListener("end", function() {
      fileServer.serve(request, response, whileServing);
    })
    .resume();
});
server.listen(process.env.PORT || 3000);
