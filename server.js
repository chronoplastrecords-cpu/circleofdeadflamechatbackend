const socket = io('https://circleofdeadflamechatbackend.onrender.com');
const messageContainer = document.getElementById('chatMessages');
const inputField = document.getElementById('userInput');
const typingIndicator = document.getElementById('typingIndicator');
// NEW: Reference to the user list in your HTML
const userListElement = document.getElementById('userList'); 

let userName = "";
let hasJoined = false;

// --- JOIN LOGIC ---

function toggleChat() {
    const container = document.getElementById('chatContainer');
    
    if (container.style.display !== 'flex' && !hasJoined) {
        const nameInput = prompt('Enter your screen name:');
        const passInput = prompt('Enter the chat password:');
        
        if (nameInput && passInput) {
            userName = nameInput;
            socket.emit('new-user', { name: nameInput, password: passInput });
        } else {
            alert("Name and password are required!");
            return;
        }
    }
    container.style.display = (container.style.display === 'flex') ? 'none' : 'flex';
}

// --- SERVER LISTENERS ---

socket.on('auth-success', () => {
    hasJoined = true;
    appendMessage('Access Granted. Welcome to the trenches, maggot!', 'bot');
});

socket.on('auth-error', (errorMsg) => {
    hasJoined = false;
    alert(errorMsg);
    document.getElementById('chatContainer').style.display = 'none';
});

// NEW: This listener updates the "Online" list whenever someone joins or leaves
socket.on('update-user-list', (names) => {
    if (!userListElement) return; // Safety check
    userListElement.innerHTML = ''; // Clear current list
    
    names.forEach(name => {
        const li = document.createElement('li');
        li.style.listStyle = "none";
        li.style.padding = "2px 0";
        li.innerText = `● ${name}`;
        userListElement.appendChild(li);
    });
});

socket.on('chat-message', data => {
    appendMessage(`${data.name}: ${data.message}`, 'bot');
});

socket.on('user-connected', name => {
    showSystemMessage(`${name} connected`);
});

socket.on('user-disconnected', name => {
    showSystemMessage(`${name} disconnected`);
});

socket.on('user-typing', (name) => {
    typingIndicator.innerText = `${name} is typing...`;
    typingIndicator.style.display = 'block';
});

socket.on('user-stop-typing', () => {
    typingIndicator.style.display = 'none';
});

// --- CORE FUNCTIONS ---

let typingTimeout;
inputField.addEventListener('keydown', () => {
    if (!hasJoined) return;
    socket.emit('typing');
    clearTimeout(typingTimeout);
    typingTimeout = setTimeout(() => socket.emit('stop-typing'), 1000);
});

function sendMessage() {
    const message = inputField.value.trim();
    if (message !== "" && hasJoined) {
        appendMessage(`You: ${message}`, 'user');
        socket.emit('send-chat-message', message);
        socket.emit('stop-typing');
        inputField.value = '';
    }
}

function appendMessage(text, sender) {
    const msgDiv = document.createElement('div');
    msgDiv.classList.add('message', sender);
    msgDiv.innerText = text;
    messageContainer.insertBefore(msgDiv, typingIndicator);
    messageContainer.scrollTop = messageContainer.scrollHeight;
}

function showSystemMessage(text) {
    const systemMsg = document.createElement('div');
    systemMsg.style.cssText = "color: #ffffff; font-size: 10px; text-align: center; margin: 5px; transition: opacity 0.5s ease;";
    systemMsg.innerText = `— ${text} —`;
    
    messageContainer.insertBefore(systemMsg, typingIndicator);
    messageContainer.scrollTop = messageContainer.scrollHeight;

    setTimeout(() => {
        systemMsg.style.opacity = '0';
        setTimeout(() => systemMsg.remove(), 500);
    }, 5000);
}

function handleKey(event) {
    if (event.key === "Enter") sendMessage();
}

window.addEventListener('beforeunload', () => {
    console.log("User has left the station.");
});

  socket.on("stop-typing", () => {
    socket.broadcast.emit("user-stop-typing");
  });

  socket.on("disconnect", () => {
    socket.broadcast.emit("user-disconnected", users[socket.id]);
    delete users[socket.id];
  });
});

