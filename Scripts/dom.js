var videoSection = document.getElementById('video');
var welcomeModalEl = document.getElementById('myModal');
var startWelcomeButton = document.getElementById('start1');
var startNameButton = document.getElementById('start2');
var nameModalEl = document.getElementById('myname');
var deviceSection = document.getElementById('device');
var callSection = document.getElementById('call');
var usersList = document.getElementById('users');
var userInput = document.getElementById('user');
var videoToggleButton = document.getElementById('videocam');
var localVideoEl = document.getElementById('localVideo');
var remoteVideoEl = document.getElementById('remoteVideo');
var micToggleButton = document.getElementById('mic');
var callButton = document.getElementById('callButton');
var hangupButton = document.getElementById('hangupButton');
var displayNameInput = document.getElementById('displayname');
var messageInput = document.getElementById('message');
var sendMessageButton = document.getElementById('sendmessage');
var discussionList = document.getElementById('discussion');
var clearMessagesButton = document.getElementById('clearMessages');
var camDeviceSelect = document.getElementById('camdev');
var micDeviceSelect = document.getElementById('micdev');
var alertBanner = document.getElementById('alert1');
var nextTimeCheckbox = document.getElementById('nexttime');
var connectionStatus = document.getElementById('connectionStatus');
var onlineCount = document.getElementById('onlineCount');
var welcomeModal = bootstrap.Modal.getOrCreateInstance(welcomeModalEl, {
    backdrop: 'static',
    keyboard: false
});
var nameModal = bootstrap.Modal.getOrCreateInstance(nameModalEl, {
    backdrop: 'static',
    keyboard: false
});

var camoff = 'Webcam/Audio (ON/<strong><u>OFF</u></strong>)';
var camon = 'Webcam (<strong><u>ON</u></strong>/OFF)';
var micoff = 'Only microphone (ON/<strong><u>OFF</u></strong>)';
var micon = 'Only microphone (<strong><u>ON</u></strong>/OFF)';

function showElement(element) {
    if (element) {
        element.hidden = false;
    }
}

function hideElement(element) {
    if (element) {
        element.hidden = true;
    }
}

function toggleElement(element) {
    if (element) {
        element.hidden = !element.hidden;
    }
}

function isElementVisible(element) {
    return !!(element && !element.hidden && element.offsetParent !== null);
}

function setMediaButtonState(button, isActive, activeHtml, inactiveHtml) {
    if (!button) {
        return;
    }

    button.dataset.active = isActive ? 'true' : 'false';
    button.classList.toggle('is-active', !!isActive);
    button.innerHTML = isActive ? activeHtml : inactiveHtml;
}

function setCameraButtonState(isActive) {
    var activeHtml = camon || 'Webcam (<strong><u>ON</u></strong>/OFF)';
    var inactiveHtml = camoff || 'Webcam/Audio (ON/<strong><u>OFF</u></strong>)';
    setMediaButtonState(videoToggleButton, isActive, activeHtml, inactiveHtml);
}

function setMicButtonState(isActive) {
    var activeHtml = micon || 'Only microphone (<strong><u>ON</u></strong>/OFF)';
    var inactiveHtml = micoff || 'Only microphone (ON/<strong><u>OFF</u></strong>)';
    setMediaButtonState(micToggleButton, isActive, activeHtml, inactiveHtml);
}

function syncPresenceSelection() {
    var selected = document.querySelector('input[name="user"]:checked');
    var selectedUser = selected ? (selected.dataset.name || '') : '';

    if (usersList) {
        usersList.querySelectorAll('.presence-option').forEach(function (option) {
            option.classList.remove('is-selected');
        });
    }

    if (selected) {
        var selectedOption = selected.closest('.presence-option');
        if (selectedOption) {
            selectedOption.classList.add('is-selected');
        }
    }

    console.trace('selected user = ', selectedUser);
    if (callButton) {
        callButton.disabled = !selectedUser;
    }
}

function stopLocalTracks() {
    if (localStream == undefined || localStream == null) {
        return;
    }

    localStream.getTracks().forEach(function (track) {
        track.stop();
    });

    localStream = null;
    if (localVideoEl) {
        localVideoEl.srcObject = null;
    }
}

if (startWelcomeButton) {
    startWelcomeButton.addEventListener('click', function () {
        if (typeof Storage !== 'undefined') {
            localStorage.nexttime = nextTimeCheckbox && nextTimeCheckbox.checked ? 'false' : 'true';
        } else {
            console.log('Sorry! No Web Storage support..');
        }

        console.log('next time ' + localStorage.nexttime);
        nameModal.show();
    });
}

if (startNameButton) {
    startNameButton.addEventListener('click', function () {
        start2();
    });
}

function start2() {
    if (navigator.getUserMedia) {
        showElement(deviceSection);
        if (isAndroid) {
            hideElement(camDeviceSelect);
            hideElement(micDeviceSelect);
            hideElement(micToggleButton);
        } else {
            selectDevice();
        }
    } else {
        hideElement(deviceSection);
        showElement(alertBanner);
    }

    hideElement(videoSection);
    hideElement(callSection);
    setCameraButtonState(false);
    setMicButtonState(false);
    starting();
}

if (userInput) {
    userInput.addEventListener('keydown', function (e) {
        if (e.key === 'Enter') {
            startNameButton.click();
        }
    });
}

if (videoToggleButton) {
    videoToggleButton.addEventListener('click', function () {
        var isActive = videoToggleButton.dataset.active === 'true';

        if (!isActive) {
            showElement(videoSection);
            setMicButtonState(false);
            startDev(1);
            connect();
        } else {
            hideElement(videoSection);
            stopLocalTracks();
            setCameraButtonState(false);
            setMicButtonState(false);
            hub.invoke('ActivateMedia', 0);
            hideElement(callSection);
        }
    });
}

if (micToggleButton) {
    micToggleButton.addEventListener('click', function () {
        toggleElement(videoSection);
        if (micToggleButton.dataset.active !== 'true') {
            setCameraButtonState(false);
            startDev(2);
            connect();
        } else {
            stopLocalTracks();
            setMicButtonState(false);
            hub.invoke('ActivateMedia', 0);
            hideElement(callSection);
        }
    });
}

if (usersList) {
    usersList.addEventListener('change', function (e) {
        if (e.target && e.target.matches('input[type=radio]')) {
            syncPresenceSelection();
        }
    });
}
