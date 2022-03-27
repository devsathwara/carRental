$(document).ready(function(){
    var socket = io();
    //connect client to server
    socket.on('connect',function(socket){
        console.log('connected to server');
    });
    // disconnect from server
    socket.on('disconnect',function(socket){
        console.log('disconnected from server');
    });
})