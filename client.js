let key_elt = document.getElementById("key");
let messages_elt = document.getElementById("messages");
let timeout_elt = document.getElementById("timeout");

function get_secs() {
    return new Date().getTime() / 1000;
}

let timeout_secs = 5 * 60;

let serverConnection = new WebSocket('wss://' + window.location.hostname + '');
serverConnection.onmessage = (msg) => {
    console.log("server message");
    console.log(msg);
    let data = JSON.parse(msg.data);
    if ("id" in data) {
        let url = "https://"+window.location.hostname +"/"+ data.id;
        key_elt.innerHTML = "Send data to <a target=\"_blank\" href=\"" + url + "\">" + url +" </a>";
        let connTime = get_secs();
        timeout_elt.innerHTML = "Closing connection in " + timeout_secs + " seconds";
        setInterval(() => {
            let remaining = (timeout_secs - (get_secs() - connTime));
            timeout_elt.innerHTML = "Closing connection in " + Math.round(remaining) + " seconds";
            if (remaining <= 0) {
                location.reload();
            }
        }, 1000);
    } else if ("data" in data) {
        let data_div = document.createElement("div");
        jsonTree.create(data, data_div);
        messages_elt.prepend(data_div);
    }
};
serverConnection.onclose = (event) => {
    console.log("closed websocket");
}
function send(data) {
    serverConnection.send(JSON.stringify(data));
}

function close() {
    serverConnection.close();
}