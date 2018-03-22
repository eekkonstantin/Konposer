/*
 * Copyright 2016 kkontagion
 * Contact: eekkonstantin@gmail.com
 *
 * This file is part of the Konposer project, under GNU GPLv3.
 * The files in the project are free for distribution, modification, and commercial use.
 * Any use of this file must have the copyright and license notices preserved.
 */

var express = require("express");
var app = express();
var http = require('http').Server(app);
var io = require('socket.io')(http);
var fs = require('fs');
var portNum = process.env.PORT || 8080;

// app.set('port', process.env.PORT || portNum);

var roomData = new Object;

function print(room, msg) {
  console.log("ROOM " + room + ": " + msg);
}

app.use(express.static(__dirname + "/public/"));
app.use("/script", express.static(__dirname + "/node_modules/script/"));
app.use("/style", express.static(__dirname + "/node_modules/style/"));

app.get('/', function(req, res){
  res.sendfile('index.html', { root: "public/"});
});

io.on('connection', function(socket) {
  // socket.on("savefile", function() {
  //   fs.writeFile("./download/test", "Hey there!", function(err) {
  //       if(err) {
  //           return console.log(err);
  //       }
  //
  //       console.log("The file was saved!");
  //   });
  // });

  /* CHANGE LOGGING */
  // socket.on("update changes", function(str) {
  //   var list = roomData[socket.roomName].changelist;
  //   list.push(str);
  //   console.log(list);
  //   io.to(socket.roomName).emit("update log", list);
  // });


  /* CREATE OR JOIN A ROOM
   *  Set the calling socket's `name` and `roomName` properties
   *  Add the room and user to the `roomData` object
   */
  socket.on("room", function(name, user) {
    socket.join(name);
    if (roomData.hasOwnProperty(name)) { // room exists
      if ((roomData[name].users).indexOf(user) != -1
          || user.length < 3) {
        var error = "User already exists!";
        if (user.length < 3)
          error = "Username too short!";
        io.to(socket.id).emit("username error", name, error);
      } else {
        roomData[name].users.push(user);
        roomData[name].changes.push(user + " logged in.");
        socket.name = user;
        socket.roomName = name;
        // populate the calling socket
        io.to(socket.id).emit("join room", roomData[name]);
        io.to(name).emit("update users", roomData[name].users);
        io.to(name).emit("update log", roomData[name].changes);
        io.to(name).emit("login notif", user);
        console.log(user + " joined room " + name + ".");
      }
    } else { // room does not exist
      if (user.length < 3) {
        error = "Username too short!";
        io.to(socket.id).emit("username error", name, error);
      } else {
        console.log("Creating room " + name + ".");
        roomData[name] = {
          "users": [user],
          "notes": [],
          "editables": { "in": {} },
          "changes": [user + " logged in."]
        };
        socket.name = user;
        socket.roomName = name;
        io.to(socket.id).emit("create room");
        io.to(name).emit("login notif", user);
        io.to(name).emit("update users", roomData[name].users);
        io.to(name).emit("update log", roomData[name].changes);
        console.log(user + " joined room " + name + ".");
      }
    }
  });


  /* EDITABLES */
  /* on focus - show username below Editable */
  socket.on("focusin", function(tie, current) {
    if (roomData.hasOwnProperty(socket.roomName)) {
      var elems = roomData[socket.roomName].editables.in;
      var editors;
      if (elems.hasOwnProperty(tie))
        editors = elems[tie];
      else {
        elems[tie] = {};
        var editors = elems[tie];
      }
      editors[socket.name] = [current];
      console.log(elems);
      // console.log(roomData[socket.roomName].editables.in);
      io.to(socket.roomName).emit("focusin", editors, tie);
    }
  });
  /* on focusout - remove username below at Editable */
  socket.on("focusout", function(tie) {
    if (roomData.hasOwnProperty(room)) {
      var editors = roomData[socket.roomName].editables.in[tie];
      // check if different from start
      var list = editors[socket.name];
      console.log(list);
      if (list[0] == list[list.length - 1])
        console.log("No changes in editable.");
      else {
        console.log("Editable changed.");
        var changelist = roomData[socket.roomName].changes;
        changelist.push(socket.name + " changed the "
                        + (tie.includes("title") ? "title " : "freetext ") + "from '"
                        + list[0] + "' to '"
                        + list[list.length - 1] + "'.");
        io.to(socket.roomName).emit("update log", roomData[socket.roomName].changes);
      }
      // remove from tied elem
      // var editorID = editors.indexOf(socket.name);
      // editors.splice(editorID, 1);
      delete editors[socket.name];
      io.to(socket.roomName).emit("focusout", editors, tie);
    }
  });

  /* on Editable changed - update in real time */
  socket.on("editable changed", function(room, elemID, elemVal) {
    if (roomData.hasOwnProperty(socket.roomName)) {
      socket.broadcast.to(room).emit("editable changed", elemID, elemVal);
      var rE = roomData[room].editables;
      rE[elemID] = elemVal;
      var ttID = elemID.replace("elem", "tt");
      var editors = rE.in[ttID];
      editors[socket.name].push(elemVal);
      // print(room, "editable " + elemID + " changed to '" + elemVal + "' by " + socket.name + ".");
      // console.log(roomData);
    }
  });




  /* NOTES */
  socket.on("notedrop", function(room, noteData) {
    if (roomData.hasOwnProperty(room)) {
      socket.broadcast.to(room).emit("notedrop", noteData);
      var r = roomData[room];
      r.notes.push(noteData);
      print(room, "note " + noteData.string + " added.");
      // console.log(roomData);
      r.changes.push(socket.name + " added "
                  + noteData.string + " to system "
                  + noteData.row + " at beat "
                  + noteData.col + ".");
      io.to(room).emit("update log", r.changes);
    }
  });

  socket.on("notedelete", function(room, noteData) {
    if (roomData.hasOwnProperty(room)) {
      socket.broadcast.to(room).emit("notedelete", noteData);
      function findNote(note) {
        return note.string == noteData.string && note.row == noteData.row && note.col == noteData.col;
      }
      var rN = roomData[room].notes;
      var noteIndex = rN.findIndex(findNote);
      var old = rN[noteIndex].string;
      rN.splice(noteIndex, 1);
      roomData[room].changes.push(socket.name + " removed "
                  + noteData.string + " from system "
                  + noteData.row + " at beat "
                  + noteData.col + ".");
      io.to(room).emit("update log", roomData[room].changes);
      print(room, "note " + old + " removed.");
    }
  });

  socket.on("disconnect", function() {
    if (roomData.hasOwnProperty(socket.roomName)) {
      // CHECK IF IN ANYWHERE
      console.log("DISCONNECT CHECKING");
      var edits = roomData[socket.roomName].editables.in;
      for (var elem in edits) {
        if (edits.hasOwnProperty(elem)) {
          console.log(elem);
          if (edits[elem].hasOwnProperty(socket.name)) {
            console.log("EDITING!!!!");
            delete edits[elem][socket.name];
            io.to(socket.roomName).emit("focusout", edits[elem], elem);
          }
        }
      }

      // REMOVE USER
      var userlist = roomData[socket.roomName].users;
      var userID = userlist.indexOf(socket.name);
      userlist.splice(userID, 1);
      // console.log(roomData);
      console.log(socket.name + " disconnected from " + socket.roomName + ".");
      roomData[socket.roomName].changes.push(socket.name + " disconnected.");
      io.to(socket.roomName).emit("update log", roomData[socket.roomName].changes);
      io.to(socket.roomName).emit("update users", roomData[socket.roomName].users);
    }
  })
});



http.listen(portNum, function(){
  console.log('listening on *:' + portNum);
});
