// hubUrl is defined in Scripts/config.js

var hub;

function setConnectionStatus(text, state) {
    if (!connectionStatus) {
        return;
    }

    connectionStatus.textContent = text;
    connectionStatus.classList.remove('status-badge--connected', 'status-badge--connecting', 'status-badge--disconnected');
    connectionStatus.classList.add('status-badge--' + state);
}

function updateOnlineCount(count) {
    if (!onlineCount) {
        return;
    }

    var suffix = count === 1 ? 'peer' : 'peers';
    onlineCount.textContent = count + ' ' + suffix;
}

function buildPresenceOption(connectionId, name, meta, checked) {
    var label = document.createElement('label');
    label.className = 'presence-option';

    var radio = document.createElement('input');
    radio.type = 'radio';
    radio.name = 'user';
    radio.value = connectionId;
    radio.dataset.name = name || '';

    if (checked) {
        radio.checked = true;
        label.classList.add('is-selected');
    }

    var copy = document.createElement('span');
    copy.className = 'presence-copy';

    var nameSpan = document.createElement('span');
    nameSpan.className = 'presence-name';
    nameSpan.textContent = name || 'Public chat';

    var metaSpan = document.createElement('span');
    metaSpan.className = 'presence-meta';
    metaSpan.textContent = meta;

    copy.appendChild(nameSpan);
    copy.appendChild(metaSpan);
    label.appendChild(radio);
    label.appendChild(copy);

    return label;
}

function appendDiscussionMessage(priv, name, message) {
    var messageItem = document.createElement('li');
    messageItem.className = 'chat-message';

    var author = document.createElement('span');
    author.className = 'chat-message__author';

    var authorName = document.createElement('span');
    authorName.textContent = name;
    author.appendChild(authorName);

    if (priv) {
        messageItem.classList.add('chat-message--private');
        var badge = document.createElement('span');
        badge.className = 'chat-message__badge';
        badge.textContent = priv;
        author.appendChild(badge);
    }

    var header = document.createElement('div');
    header.className = 'chat-message__header';
    header.appendChild(author);

    var timestamp = document.createElement('span');
    timestamp.className = 'chat-message__timestamp';
    timestamp.textContent = getTime();
    header.appendChild(timestamp);

    var body = document.createElement('p');
    body.className = 'chat-message__body';
    body.textContent = message;

    messageItem.appendChild(header);
    messageItem.appendChild(body);
    discussionList.insertBefore(messageItem, discussionList.firstChild);
}

function renderUsersOnLine(usersdata) {
    var selected = document.querySelector('input[name="user"]:checked');
    var previousSelection = selected ? selected.value : 'public';
    var hasPreviousSelection = previousSelection === 'public';

    usersList.textContent = '';

    for (var i = 0; i < usersdata.length; i++) {
        if (usersdata[i].connectionId === previousSelection) {
            hasPreviousSelection = true;
            break;
        }
    }

    usersList.appendChild(buildPresenceOption('public', '', 'Send a message to everyone in the room.', hasPreviousSelection && previousSelection === 'public'));

    if (!usersdata.length) {
        var empty = document.createElement('div');
        empty.className = 'presence-empty';
        empty.textContent = 'No one else is online yet. Public chat stays available while you wait for another person to join.';
        usersList.appendChild(empty);
    }

    for (var j = 0; j < usersdata.length; j++) {
        var media = usersdata[j].broMedia;
        var mediaLabel = 'Ready to chat';

        switch (media) {
            case 1:
                mediaLabel = 'Webcam available';
                break;
            case 2:
                mediaLabel = 'Microphone available';
                break;
        }

        var browserLabel = usersdata[j].browser ? usersdata[j].browser + ' • ' + mediaLabel : mediaLabel;
        var isSelected = hasPreviousSelection && usersdata[j].connectionId === previousSelection;
        usersList.appendChild(buildPresenceOption(usersdata[j].connectionId, usersdata[j].name, browserLabel, isSelected));
    }

    if (!hasPreviousSelection) {
        var publicRadio = document.querySelector('input[name="user"][value="public"]');
        if (publicRadio) {
            publicRadio.checked = true;
            var publicOption = publicRadio.closest('.presence-option');
            if (publicOption) {
                publicOption.classList.add('is-selected');
            }
        }
    }
}

function userConnect(name) {
    console.trace('user = ' + name);
    console.trace('browser = ' + adapter.browserDetails.browser);

    if (displayNameInput) {
        displayNameInput.value = name;
    }
    if (messageInput) {
        messageInput.focus();
    }

    setConnectionStatus('Connecting...', 'connecting');

    hub = new signalR.HubConnectionBuilder()
        .withUrl(hubUrl + '?userName=' + encodeURIComponent(name) + '&browser=' + encodeURIComponent(adapter.browserDetails.browser))
        .withAutomaticReconnect()
        .build();

    hub.on('broadcastMessage', function (priv, senderName, message) {
        appendDiscussionMessage(priv, senderName, message);
        console.log('message', message);
        var audio = new Audio('/sound/page-flip-01a.mp3');
        audio.play().catch(function (err) {
            if (err.name !== 'NotAllowedError') {
                console.error('audio play failed:', err);
            }
        });
    });

    hub.on('showUsersOnLine', function (users) {
        var usersdata1 = JSON.parse(users);
        console.log('my name = ' + (displayNameInput ? displayNameInput.value : ''));
        var usersdata = usersdata1.filter(function (el) {
            return el.name != (displayNameInput ? displayNameInput.value : '');
        });

        updateOnlineCount(usersdata.length);
        renderUsersOnLine(usersdata);

        if (usersdata.length) {
            var audio = new Audio('/sound/bottle-open-1.mp3');
            audio.play().catch(function (err) {
                if (err.name !== 'NotAllowedError') {
                    console.error('audio play failed:', err);
                }
            });
        }

        syncPresenceSelection();
    });

    hub.onreconnecting(function () {
        setConnectionStatus('Reconnecting...', 'connecting');
    });

    hub.onreconnected(function () {
        setConnectionStatus('Connected', 'connected');
    });

    hub.on('hangUpVideo', function () {
        hangup();
    });
    hub.on('sendOffer', function (desc) {
        trace('Offer sent ' + desc);
        answer(JSON.parse(desc));
    });
    hub.on('sendIce', function (desc) {
        trace('Ice sent ' + desc);
        addIceCandidate(JSON.parse(desc));
    });
    hub.on('sendAnswer', function (desc) {
        trace('Answer sent ' + desc);
        getAnswer(JSON.parse(desc));
    });

    startHub();
}

function startHub() {
    function connectHub() {
        setConnectionStatus('Connecting...', 'connecting');

        hub.start().then(function () {
            console.log('hub started');
            setConnectionStatus('Connected', 'connected');
        }).catch(function (err) {
            setConnectionStatus('Disconnected', 'disconnected');
            console.error(err);
            setTimeout(connectHub, 5000);
        });
    }

    if (sendMessageButton) {
        sendMessageButton.addEventListener('click', function () {
            var selectedUser = document.querySelector('input[name="user"]:checked');
            var conn = selectedUser ? selectedUser.value : '';
            var conname = selectedUser ? (selectedUser.dataset.name || '') : '';
            console.trace('conn = ' + conn + '/' + conname);

            if (!conn || conn == 'public' || !conname) {
                hub.invoke('Send', displayNameInput ? displayNameInput.value : '', messageInput ? messageInput.value : '');
            } else {
                hub.invoke('SendToUser', conname, conn, displayNameInput ? displayNameInput.value : '', messageInput ? messageInput.value : '');
            }

            if (messageInput) {
                messageInput.value = '';
                messageInput.focus();
            }
        });
    }

    if (messageInput) {
        messageInput.addEventListener('keydown', function (e) {
            if (e.key === 'Enter') {
                sendMessageButton.click();
            }
        });
    }

    if (clearMessagesButton) {
        clearMessagesButton.addEventListener('click', function () {
            discussionList.textContent = '';
        });
    }

    hub.onclose(function () {
        setConnectionStatus('Disconnected', 'disconnected');
        setTimeout(connectHub, 5000);
    });

    connectHub();
}
