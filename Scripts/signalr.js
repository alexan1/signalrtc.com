// Hub URL — switch for local vs production
//var hubUrl = "http://localhost:5000/signalr";
var hubUrl = "https://signalrtc-hfejcjbsc6acf7fj.canadaeast-01.azurewebsites.net/signalr";

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

function userConnect(name) {
    console.trace('user = ' + name);
    console.trace('browser = ' + webrtcDetectedBrowser);
    $displayname.val(name);
    $message.focus();

    hub = new signalR.HubConnectionBuilder()
        .withUrl(hubUrl + "?userName=" + encodeURIComponent(name) + "&browser=" + encodeURIComponent(webrtcDetectedBrowser))
        .withAutomaticReconnect()
        .build();

    hub.on("broadcastMessage", function (priv, name, message) {
        var encodedName = $('<div />').text(name).html();
        var encodedMsg = $('<div />').text(message).html();
        if (priv) {
            message = "<font color='blue'><small>[" + priv + "]</small></font>  " + encodedMsg;
        }
        message = message + "    <font color='Gray'><small>" + getTime() + "</small></font>";
        $discussion.prepend('<li><strong>' + encodedName + '</strong>:&nbsp;&nbsp;' + message + '</li>');
        console.log('message', message);
        var audio = new Audio('/sound/page-flip-01a.mp3');
        audio.play();
    });

    hub.on("showUsersOnLine", function (users) {
        var usersdata1 = JSON.parse(users);
        console.log("my name = " + $displayname.val());
        var usersdata = usersdata1.filter(function (el) { return el.Name != $displayname.val(); });
        if (usersdata[0] != null) {
            var audio = new Audio('/sound/bottle-open-1.mp3');
            audio.play();
            $users.empty();
            $users.append('<input type="radio" value="public" name="user" checked><label>Public</label><br />');
            for (var i = 0; i < usersdata.length; i++) {
                var connectionId = usersdata[i].ConnectionId;
                var media = usersdata[i].BroMedia;
                var med = " ";
                switch (media) {
                    case 0: med = " "; break;
                    case 1: med = "WebCam"; break;
                    case 2: med = "Mic"; break;
                    default: med = "Nothing"; break;
                }
                $users.append('<input type="radio" value="' + connectionId + '" name="user"><label>' + usersdata[i].Name + ' </label>  <label><font color="Green"><small>/' + usersdata[i].Browser + '/ </small></font></label><label><font color="Red"><small>  ' + med + '</small></font><br/></label><br/>');
            }
            $('input[name="user"][value="public"]').prop('checked', true);
        } else {
            $users.empty();
        }
        $callButton.prop('disabled', true);
    });

    hub.on("hangUpVideo", function () { hangup(); });
    hub.on("sendOffer",   function (desc) { trace('Offer sent ' + desc); answer(JSON.parse(desc)); });
    hub.on("sendIce",     function (desc) { trace('Ice sent ' + desc); addIceCandidate(JSON.parse(desc)); });
    hub.on("sendAnswer",  function (desc) { trace('Answer sent ' + desc); getAnswer(JSON.parse(desc)); });

    startHub();
}

function startHub() {
    hub.start().then(function () {
        console.log('hub started');
        $sendmessage.click(function () {
            var conn = $('input[name="user"]:checked').val();
            var conname = $('input[name="user"]:checked').next().text().split(' ')[0];
            console.trace('conn = ' + conn + '/' + conname);
            if (conn == "public") {
                hub.invoke("Send", $displayname.val(), $message.val());
            } else {
                hub.invoke("SendToUser", conname, conn, $displayname.val(), $message.val());
            }
            $message.val('').focus();
        });

        hub.onclose(function () {
            setTimeout(function () { hub.start(); }, 5000);
        });

        $message.keypress(function (e) {
            if (e.which == 13) { $sendmessage.click(); }
        });
        $clearMessages.click(function () { $discussion.empty(); });
    }).catch(function (err) {
        console.error(err);
    });
}

