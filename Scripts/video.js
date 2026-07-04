'use strict';

var startTime;
var localStream;
var connection;
var enableAudioButton = document.getElementById('enableAudioBtn');

if (callButton) {
    callButton.disabled = true;
    callButton.addEventListener('click', function () {
        console.trace('Call me!');
        call();
    });
}

if (hangupButton) {
    hangupButton.addEventListener('click', function () {
        hub.invoke('HangUp');
    });
}

var sdpConstraints = {
    offerToReceiveAudio: true,
    offerToReceiveVideo: true
};

if (localVideoEl) {
    localVideoEl.addEventListener('loadedmetadata', function () {
        trace('Local video currentSrc: ' + this.currentSrc + ', videoWidth: ' + this.videoWidth + 'px,  videoHeight: ' + this.videoHeight + 'px');
    });
}

if (remoteVideoEl) {
    remoteVideoEl.addEventListener('loadedmetadata', function () {
        trace('Remote video currentSrc: ' + this.currentSrc + ', videoWidth: ' + this.videoWidth + 'px,  videoHeight: ' + this.videoHeight + 'px');
    });
}

function selectDevice() {
    if (camDeviceSelect) {
        camDeviceSelect.textContent = '';
    }
    if (micDeviceSelect) {
        micDeviceSelect.textContent = '';
    }

    navigator.mediaDevices.enumerateDevices().then(function (devices) {
        var camnumber = 0;
        var micnumber = 0;

        devices.forEach(function (device) {
            console.log(device.kind + ': ' + device.label + ' id = ' + device.deviceId);

            if (device.kind == 'videoinput') {
                camnumber++;
                var camOption = document.createElement('option');
                camOption.value = device.deviceId;
                camOption.textContent = device.label || 'Webcam' + camnumber;
                camDeviceSelect.appendChild(camOption);
            } else if (device.kind == 'audioinput') {
                micnumber++;
                var micOption = document.createElement('option');
                micOption.value = device.deviceId;
                micOption.textContent = device.label || 'Microphone' + micnumber;
                micDeviceSelect.appendChild(micOption);
            }
        });

        if (camnumber == 0) {
            hideElement(camDeviceSelect);
            if (videoToggleButton) {
                videoToggleButton.disabled = true;
            }
        }
        if (micnumber == 0) {
            hideElement(micDeviceSelect);
            if (micToggleButton) {
                micToggleButton.disabled = true;
            }
        }
    }).catch(function (err) {
        console.log(err.name + ': ' + err.message);
    });
}

function startDev(media) {
    var audioId = micDeviceSelect ? micDeviceSelect.value : '';
    var videoId = camDeviceSelect ? camDeviceSelect.value : '';

    hideElement(remoteVideoEl);
    if (callButton) {
        callButton.disabled = true;
    }
    if (hangupButton) {
        hangupButton.disabled = true;
    }

    console.trace('media = ' + media);
    var constraints;

    switch (media) {
        case 1:
            constraints = {
                audio: audioId ? { deviceId: { exact: audioId } } : true,
                video: videoId ? { deviceId: { exact: videoId } } : true
            };
            setCameraButtonState(true);
            setMicButtonState(false);
            break;
        case 2:
            constraints = {
                video: false,
                audio: audioId ? { deviceId: { exact: audioId } } : true
            };
            setCameraButtonState(false);
            setMicButtonState(true);
            break;
        default:
            constraints = { audio: false, video: false };
            break;
    }

    if (navigator.getUserMedia) {
        navigator.mediaDevices.getUserMedia(constraints)
            .then(gotStream)
            .catch(errorWebCam);
    }
}

function connect() {
    if (RTCPeerConnection) {
        var servers = { iceServers: [{ urls: 'stun:stun.l.google.com:19302' }] };

        connection = new RTCPeerConnection(servers);
        connection.onicecandidate = function (e) {
            hub.invoke('IceCandidate', JSON.stringify({ candidate: e.candidate }));
        };
        connection.ontrack = function (e) {
            if (callButton) {
                callButton.disabled = true;
            }
            hideElement(deviceSection);
            if (remoteVideoEl.srcObject !== e.streams[0]) {
                remoteVideoEl.srcObject = e.streams[0];
                remoteVideoEl.play().catch(function (err) {
                    trace('remoteVideo play failed: ' + err);
                    if (err.name === 'NotAllowedError' && enableAudioButton) {
                        enableAudioButton.style.display = 'block';
                    }
                });
                trace('received remote stream');
            }
        };
        showElement(callSection);
    } else {
        hideElement(callSection);
        showElement(alertBanner);
    }
}

function call() {
    var selectedUser = document.querySelector('input[name="user"]:checked');
    var conn = selectedUser ? selectedUser.value : '';
    trace('conn1 = ' + conn);

    if (conn == 'public') {
        alert('Sorry, you need to select user with whom you want to have video chat.');
        return;
    }

    if (callButton) {
        callButton.disabled = true;
    }

    showElement(remoteVideoEl);
    hideElement(deviceSection);

    if (hangupButton) {
        hangupButton.disabled = false;
    }

    trace('Starting call');
    startTime = window.performance.now();

    var videoTracks = localStream.getVideoTracks();
    var audioTracks = localStream.getAudioTracks();

    if (videoTracks.length > 0) {
        trace('Using video device: ' + videoTracks[0].label);
    }
    if (audioTracks.length > 0) {
        trace('Using audio device: ' + audioTracks[0].label);
    }

    if (localStream != null) {
        localStream.getTracks().forEach(function (track) {
            connection.addTrack(track, localStream);
        });
        trace('Added local stream to connection');
    }

    trace('connection createOffer start');
    connection.createOffer(sdpConstraints).then(onCreateOfferSuccess).catch(errorHandler);
}

function answer(message) {
    showElement(remoteVideoEl);
    if (hangupButton) {
        hangupButton.disabled = false;
    }

    trace('send answer ' + message.sdp);
    connection.setRemoteDescription(new RTCSessionDescription(message.sdp)).then(function () {
        trace('setRemoteDescription');
        if (localStream != null) {
            localStream.getTracks().forEach(function (track) {
                connection.addTrack(track, localStream);
            });
        }

        connection.createAnswer().then(function (desc) {
            connection.setLocalDescription(desc).then(function () {
                hub.invoke('Answer', JSON.stringify({ sdp: desc }));
            }).catch(errorHandler);
        }).catch(errorHandler);
    }).catch(errorHandler);
}

function addIceCandidate(message) {
    if (message.candidate != null) {
        trace('add ice candidate');
        connection.addIceCandidate(new RTCIceCandidate(message.candidate));
    }
}

function getAnswer(message) {
    if (message.sdp != null) {
        trace('get answer');
        connection.setRemoteDescription(new RTCSessionDescription(message.sdp));
    }
}

function gotStream(stream) {
    trace('Received local stream');
    var media = 0;

    if (stream.getVideoTracks().length) {
        setCameraButtonState(true);
        setMicButtonState(false);
        showElement(localVideoEl);
        localVideoEl.srcObject = stream;
        media = 1;
    } else {
        setCameraButtonState(false);
        setMicButtonState(true);
        hideElement(localVideoEl);
        media = 2;
    }

    localStream = stream;
    hub.invoke('ActivateMedia', media);
}

function onCreateOfferSuccess(desc) {
    trace('Offer created');
    trace('setLocalDescription start');
    var selectedUser = document.querySelector('input[name="user"]:checked');
    var conn = selectedUser ? selectedUser.value : '';
    trace('conn2 = ' + conn);
    hideElement(deviceSection);

    if (conn == 'public') {
        alert('Sorry, you need to select user with whom you want to have video chat.');
        hangup();
        return;
    }

    connection.setLocalDescription(desc).then(function () {
        hub.invoke('Offer', conn, JSON.stringify({ sdp: desc }));
        onSetLocalSuccess(connection);
    }).catch(errorHandler);
}

function onSetLocalSuccess(connection) {
    trace(' setLocalDescription complete');
}

function onSetRemoteSuccess(connection) {
    trace(' setRemoteDescription complete');
}

function onCreateAnswerSuccess(desc) {
    trace('Answer from pc2:\n' + desc.sdp);
    trace('pc1 setRemoteDescription start');
    trace('pc2 setLocalDescription start');
    connection.setLocalDescription(desc, function () {
        onSetLocalSuccess(connection);
    }, errorHandler);
}

function onAddIceCandidateSuccess(connection) {
    trace(' addIceCandidate success');
}

function onAddIceCandidateError(connection, error) {
    trace(' failed to add ICE Candidate: ' + error.toString());
}

var errorHandler = function (err) {
    console.error(err);
};

var errorWebCam = function (err) {
    console.error(err);
    alert('Sorry, camera/microphone is unavailable: ' + err.message);
    hideElement(localVideoEl);
    setCameraButtonState(false);
    setMicButtonState(false);
    hideElement(callSection);
};

var errorMic = function (err) {
    console.error(err);
    alert('Sorry, Mic is absent');
    hideElement(videoSection);
    if (callButton) {
        callButton.disabled = true;
    }
    setMicButtonState(false);
    hideElement(callSection);
};

function hangup() {
    trace('Ending call');
    if (connection) {
        connection.close();
    }
    connection = null;
    hideElement(remoteVideoEl);
    if (enableAudioButton) {
        enableAudioButton.style.display = 'none';
    }
    showElement(deviceSection);
    connect();
    if (hangupButton) {
        hangupButton.disabled = true;
    }
}
