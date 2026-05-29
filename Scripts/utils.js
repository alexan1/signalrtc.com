function trace(msg) { console.log(msg); }

var ua = navigator.userAgent.toLowerCase();
var isAndroid = ua.indexOf("android") > -1;
console.log(ua);
console.log("isAndroid = " + isAndroid);

var username = localStorage.userName;

if (username != 'undefined' && username != undefined) {
    start2();
}
else {
    if (isAndroid || localStorage.nexttime == 'false') {
        $myname.modal('show');
    } else {
        $myModal.modal('show');
    }
}

function onSignIn(googleUser) {
    var profile = googleUser.getBasicProfile();
    console.log("ID: " + profile.getId());
    console.log("Name: " + profile.getName());
    console.log("Image URL: " + profile.getImageUrl());
    console.log("Email: " + profile.getEmail());
    localStorage.userName = profile.getName();

    var id_token = googleUser.getAuthResponse().id_token;
    console.log("ID Token: " + id_token);
    $start2.click();
}

function generateQuickGuid() {
    return Math.random().toString(36).substring(2, 15);
}

function getTime() {
    var dt = new Date();
    return dt.getHours() + ":" + dt.getMinutes() + ":" + dt.getSeconds();
}

function getUrlVars() {
    var vars = [], hash;
    var hashes = window.location.href.slice(window.location.href.indexOf('?') + 1).split('&');
    for (var i = 0; i < hashes.length; i++) {
        hash = hashes[i].split('=');
        vars.push(hash[0]);
        vars[hash[0]] = hash[1];
    }
    return vars;
}

function setMediaButtonState($button, isActive, activeHtml, inactiveHtml) {
    $button
        .data('active', isActive)
        .toggleClass('is-active', isActive)
        .html(isActive ? activeHtml : inactiveHtml);
}

function setCameraButtonState(isActive) {
    setMediaButtonState($videocam, isActive, camon, camoff);
}

function setMicButtonState(isActive) {
    setMediaButtonState($mic, isActive, micon, micoff);
}

function syncPresenceSelection() {
    var $selected = $('input[name="user"]:checked');
    var selecteduser = $selected.attr('data-name') || '';

    $users.find('.presence-option').removeClass('is-selected');
    $selected.closest('.presence-option').addClass('is-selected');

    console.trace('selected user = ', selecteduser);
    $callButton.prop('disabled', !selecteduser);
}

function stopLocalTracks() {
    if (localStream == undefined || localStream == null) {
        return;
    }

    localStream.getTracks().forEach(function (track) {
        track.stop();
    });

    localStream = null;
    $localVideo.get(0).srcObject = null;
}

$start1.click(function () {
    if (typeof (Storage) !== "undefined") {
        localStorage.nexttime = true;
        if ($nexttime.is(':checked')) {
            localStorage.nexttime = false;
        }
    } else {
        console.log("Sorry! No Web Storage support..");
    }
    console.log("next time " + localStorage.nexttime);
    $myname.modal('show');
});

$start2.click(function () {
    start2();
});

function start2() {
    if (navigator.getUserMedia) {
        $device.show();
        if (isAndroid) {
            $camdev.hide();
            $micdev.hide();
            $mic.hide();
        }
        else {
            selectDevice();
        }
    }
    else {
        $device.hide();
        $alert1.show();
    }
    $video.hide();
    $call.hide();
    setCameraButtonState(false);
    setMicButtonState(false);
    starting();
}

$user.keypress(function (e) {
    if (e.which == 13) {
        $start2.click();
    }
});

$videocam.click(function () {
    $video.toggle();
    if ($localVideo.is(':visible')) {
        setMicButtonState(false);
        startDev(1);
        connect();
    }
    else {
        stopLocalTracks();
        setCameraButtonState(false);
        setMicButtonState(false);
        hub.invoke("ActivateMedia", 0);
        $call.hide();
    }
});

$mic.click(function () {
    $video.toggle();
    if (!$mic.data('active')) {
        setCameraButtonState(false);
        startDev(2);
        connect();
    }
    else {
        stopLocalTracks();
        setMicButtonState(false);
        hub.invoke("ActivateMedia", 0);
        $call.hide();
    }
});

var camoff = 'Webcam/Audio (ON/<strong><u>OFF</u></strong>)';
var camon = 'Webcam (<strong><u>ON</u></strong>/OFF)';
var micoff = 'Only microphone (ON/<strong><u>OFF</u></strong>)';
var micon = 'Only microphone (<strong><u>ON</u></strong>/OFF)';

$users.on("change", "input[type=radio]", function () {
    syncPresenceSelection();
});
