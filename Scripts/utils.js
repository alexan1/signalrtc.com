﻿$('#content').hide();

function generateQuickGuid() {
    return Math.random().toString(36).substring(2, 15);
        //+ Math.random().toString(36).substring(2, 15);
}

function getTime() {
    var dt = new Date();
    return dt.getHours() + ":" + dt.getMinutes() + ":" + dt.getSeconds();
}


$('#start').click(function () {
    $('#content').show();
    $('#video').hide();
    $('#info').hide();
    $('#start').hide();
    starting();
});

$('#videocam').click(function () {   
    $('#video').toggle();    
    if ($('#video').is(':visible')) {
        $('#videocam').html('Webcam (<strong><u>ON</u></strong>/OFF)');
        start(true);
    }
    else {
        $('#videocam').html('Webcam (ON/<strong><u>OFF</u></strong>)');
    }
});
