function trace(msg) { console.log(msg); }

var ua = navigator.userAgent.toLowerCase();
var isAndroid = ua.indexOf('android') > -1;
console.log(ua);
console.log('isAndroid = ' + isAndroid);

function generateQuickGuid() {
    return Math.random().toString(36).substring(2, 15);
}

function getTime() {
    var dt = new Date();
    return dt.getHours() + ':' + dt.getMinutes() + ':' + dt.getSeconds();
}

function getUrlVars() {
    var vars = [];
    var hash;
    var hashes = window.location.href.slice(window.location.href.indexOf('?') + 1).split('&');

    for (var i = 0; i < hashes.length; i++) {
        hash = hashes[i].split('=');
        vars.push(hash[0]);
        vars[hash[0]] = hash[1];
    }

    return vars;
}

function getUserName() {
    var name = localStorage.userName;

    if (!(name) || name == 'undefined') {
        name = userInput ? userInput.value : '';
    }

    name = (name || '').toString().trim();

    if (!(name) || name == null) {
        name = generateQuickGuid();
    } else {
        localStorage.userName = name;
    }

    userConnect(name);
}

function starting() {
    getUserName();
}

window.addEventListener('DOMContentLoaded', function () {
    if (typeof start2 !== 'function' || typeof welcomeModal === 'undefined' || typeof nameModal === 'undefined') {
        return;
    }

    var username = localStorage.userName;

    if (username != 'undefined' && username != undefined) {
        start2();
        return;
    }

    if (isAndroid || localStorage.nexttime == 'false') {
        nameModal.show();
    } else {
        welcomeModal.show();
    }
});
