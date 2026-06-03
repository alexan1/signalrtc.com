// hubUrl is defined in Scripts/config.js

var hub;

function starting() {
    getUserName();
}

function getUserName() {
    var name = localStorage.userName;
    if (!(name) || name == "undefined") {
        name = $user.val();
    }
    name = $.trim(name);
    if (!(name) || name == null) {
        name = generateQuickGuid();
    } else {
        localStorage.userName = name;
    }
    userConnect(name);
}

function setConnectionStatus(text, state) {
    if (!$connectionStatus.length) {
        return;
    }

    $connectionStatus
        .text(text)
        .removeClass('status-badge--connected status-badge--connecting status-badge--disconnected')
        .addClass('status-badge--' + state);
}

function updateOnlineCount(count) {
    if (!$onlineCount.length) {
        return;
    }

    var suffix = count === 1 ? 'peer' : 'peers';
    $onlineCount.text(count + ' ' + suffix);
}

function buildPresenceOption(connectionId, name, meta, checked) {
    var $option = $('<label class="presence-option"></label>');
    var $radio = $('<input type="radio" name="user">')
        .val(connectionId)
        .attr('data-name', name || '');

    if (checked) {
        $radio.prop('checked', true);
        $option.addClass('is-selected');
    }

    $option.append(
        $radio,
        $('<span class="presence-copy"></span>').append(
            $('<span class="presence-name"></span>').text(name || 'Public chat'),
            $('<span class="presence-meta"></span>').text(meta)
        )
    );

    return $option;
}

function appendDiscussionMessage(priv, name, message) {
    var $messageItem = $('<li class="chat-message"></li>');
    var $author = $('<span class="chat-message__author"></span>').append(
        $('<span></span>').text(name)
    );
    var $header = $('<div class="chat-message__header"></div>').append(
        $author,
        $('<span class="chat-message__timestamp"></span>').text(getTime())
    );

    if (priv) {
        $messageItem.addClass('chat-message--private');
        $author.append(
            $('<span class="chat-message__badge"></span>').text(priv)
        );
    }

    $messageItem.append(
        $header,
        $('<p class="chat-message__body"></p>').text(message)
    );

    $discussion.prepend($messageItem);
}

function renderUsersOnLine(usersdata) {
    var previousSelection = $('input[name="user"]:checked').val() || 'public';
    var hasPreviousSelection = previousSelection === 'public';

    $users.empty();

    for (var i = 0; i < usersdata.length; i++) {
        if (usersdata[i].connectionId === previousSelection) {
            hasPreviousSelection = true;
            break;
        }
    }

    $users.append(buildPresenceOption('public', '', 'Send a message to everyone in the room.', hasPreviousSelection && previousSelection === 'public'));

    if (!usersdata.length) {
        $users.append(
            $('<div class="presence-empty"></div>').text('No one else is online yet. Public chat stays available while you wait for another person to join.')
        );
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

        var browserLabel = usersdata[j].browser ? usersdata[j].browser + ' \u2022 ' + mediaLabel : mediaLabel;
        var isSelected = hasPreviousSelection && usersdata[j].connectionId === previousSelection;
        $users.append(buildPresenceOption(usersdata[j].connectionId, usersdata[j].name, browserLabel, isSelected));
    }

    if (!hasPreviousSelection) {
        $('input[name="user"][value="public"]').prop('checked', true).closest('.presence-option').addClass('is-selected');
    }
}

function userConnect(name) {
    console.trace('user = ' + name);
    console.trace('browser = ' + adapter.browserDetails.browser);
    $displayname.val(name);
    $message.focus();
    setConnectionStatus('Connecting...', 'connecting');

    hub = new signalR.HubConnectionBuilder()
        .withUrl(hubUrl + "?userName=" + encodeURIComponent(name) + "&browser=" + encodeURIComponent(adapter.browserDetails.browser))
        .withAutomaticReconnect()
        .build();

    hub.on("broadcastMessage", function (priv, name, message) {
        appendDiscussionMessage(priv, name, message);
        console.log('message', message);
        var audio = new Audio('/sound/page-flip-01a.mp3');
        audio.play().catch(function (err) { if (err.name !== 'NotAllowedError') console.error('audio play failed:', err); });
    });

    hub.on("showUsersOnLine", function (users) {
        var usersdata1 = JSON.parse(users);
        console.log("my name = " + $displayname.val());
        var usersdata = usersdata1.filter(function (el) { return el.name != $displayname.val(); });

        updateOnlineCount(usersdata.length);
        renderUsersOnLine(usersdata);

        if (usersdata.length) {
            var audio = new Audio('/sound/bottle-open-1.mp3');
            audio.play().catch(function (err) { if (err.name !== 'NotAllowedError') console.error('audio play failed:', err); });
        }

        syncPresenceSelection();
    });

    hub.onreconnecting(function () {
        setConnectionStatus('Reconnecting...', 'connecting');
    });

    hub.onreconnected(function () {
        setConnectionStatus('Connected', 'connected');
    });

    hub.on("hangUpVideo", function () { hangup(); });
    hub.on("sendOffer", function (desc) { trace('Offer sent ' + desc); answer(JSON.parse(desc)); });
    hub.on("sendIce", function (desc) { trace('Ice sent ' + desc); addIceCandidate(JSON.parse(desc)); });
    hub.on("sendAnswer", function (desc) { trace('Answer sent ' + desc); getAnswer(JSON.parse(desc)); });

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

    $sendmessage.off('click').on('click', function () {
        var $selectedUser = $('input[name="user"]:checked');
        var conn = $selectedUser.val();
        var conname = $selectedUser.attr('data-name') || '';
        console.trace('conn = ' + conn + '/' + conname);
        if (!conn || conn == "public" || !conname) {
            hub.invoke("Send", $displayname.val(), $message.val());
        } else {
            hub.invoke("SendToUser", conname, conn, $displayname.val(), $message.val());
        }
        $message.val('').focus();
    });

    $message.off('keypress').on('keypress', function (e) {
        if (e.which == 13) {
            $sendmessage.click();
        }
    });

    $clearMessages.off('click').on('click', function () { $discussion.empty(); });

    hub.onclose(function () {
        setConnectionStatus('Disconnected', 'disconnected');
        setTimeout(connectHub, 5000);
    });

    connectHub();
}
