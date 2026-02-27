const socket = io('https://circleofdeadflamechatbackend.onrender.com');
const messageContainer = document.getElementById('chatMessages');
const inputField = document.getElementById('userInput');
const typingIndicator = document.getElementById('typingIndicator');
const userListElement = document.getElementById('userList'); 
const ping = document.getElementById('pingSound');
const chatContainer = document.getElementById('chatContainer');

let userName = "";
let hasJoined = false;

// --- JOIN LOGIC ---
function toggleChat() {
    if (chatContainer.style.display !== 'flex' && !hasJoined) {
        const nameInput = prompt('Enter your screen name:');

        if (nameInput) {
            userName = nameInput;
            // Password-free login
            socket.emit('new-user', { name: nameInput });
        } else {
            alert("A screen name is required!");
            return;
        }
    }
    chatContainer.style.display = (chatContainer.style.display === 'flex') ? 'none' : 'flex';
}

// --- SERVER LISTENERS ---
socket.on('auth-success', () => {
    hasJoined = true;
    // KVLT-style join message
    showSystemMessage('Access Granted. Welcome to the trenches, maggot!');
    showSystemMessage('Rules: 1) Keep it civil. 2) No spam. 3) No NSFW content. 4) Respect everyone.');
});

socket.on('auth-error', (errorMsg) => {
    hasJoined = false;
    alert(errorMsg);
    chatContainer.style.display = 'none';
});

// Update user list
socket.on('update-user-list', names => {
    if (!userListElement) return;
    userListElement.innerHTML = ''; 
    
    names.forEach(name => {
        const li = document.createElement('li');
        li.style.listStyle = "none";
        li.style.padding = "2px 0";
        li.innerText = `● ${name}`;
        userListElement.appendChild(li);
    });
});

// Chat messages
socket.on('chat-message', data => {
    appendMessage(`${data.name}: ${data.message}`, 'bot');
});

// User join/leave messages
socket.on('user-connected', name => {
    showSystemMessage(`${name} joined the fray`);
});
socket.on('user-disconnected', name => {
    showSystemMessage(`${name} retreated`);
});

// Typing indicators
socket.on('user-typing', name => {
    typingIndicator.innerText = `${name} is reloading...`;
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

// --- KVLT-STYLE SYSTEM MESSAGES ---
function showSystemMessage(text) {
    const systemMsg = document.createElement('div');
    
    // KVLT tactical styling
    systemMsg.style.cssText = `
        color: #ff0000;
        text-shadow: 0 0 5px #ff0000, 0 0 10px #ff0000, 0 0 20px #ff0000;
        font-size: 11px;
        text-align: center;
        margin: 6px 0;
        font-family: "iceland", monospace;
        font-style: italic;
        opacity: 0;
        transform: scale(0.95);
        transition: opacity 0.5s ease, transform 0.5s ease;
    `;
    
    systemMsg.innerText = `— ${text} —`;
    messageContainer.insertBefore(systemMsg, typingIndicator);
    messageContainer.scrollTop = messageContainer.scrollHeight;
    
    // Fade in
    requestAnimationFrame(() => {
        systemMsg.style.opacity = '1';
        systemMsg.style.transform = 'scale(1)';
    });
    
    // Optional subtle shake effect
    let shakeInterval = setInterval(() => {
        systemMsg.style.transform = `scale(1) translateX(${Math.random()*2-1}px)`;
    }, 80);
    
    // Fade out and remove after 5s
    setTimeout(() => {
        clearInterval(shakeInterval);
        systemMsg.style.opacity = '0';
        systemMsg.style.transform = 'scale(0.95)';
        setTimeout(() => systemMsg.remove(), 500);
    }, 5000);
}

// Enter key sends message
function handleKey(event) {
    if (event.key === "Enter") sendMessage();
}

// Optional: notify on tab close
window.addEventListener('beforeunload', () => {
    console.log("User has left the station.");
});

// --- COLLAPSIBLE USER LIST ---
function toggleUserList() {
    const wrapper = document.getElementById('userListWrapper');
    const btn = document.getElementById('listToggleBtn');
    const currentDisplay = window.getComputedStyle(wrapper).display;
    
    if (currentDisplay === 'none') {
        wrapper.style.display = 'block';
        btn.innerText = '[ HIDE ]';
    } else {
        wrapper.style.display = 'none';
        btn.innerText = '[ SHOW ]';
    }
}

// --- CONNECTION STATUS ---
socket.on('connect', () => console.log("Comms online."));
socket.on('disconnect', () => {
    if(userListElement) userListElement.innerHTML = '<li style="color:orange">Signal lost...</li>';
});
