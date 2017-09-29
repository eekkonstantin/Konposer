/*
 * Copyright 2016 kkontagion
 * Contact: eekkonstantin@gmail.com
 *
 * This file is part of the Konposer project, under GNU GPLv3.
 * The files in the project are free for distribution, modification, and commercial use.
 * Any use of this file must have the copyright and license notices preserved.
 */

var changeCount = 0;
var origEd = "";
$(function() {
  function createNote(noteData) {
    var dropnote = $(document.createElement("article"));
    dropnote.data(noteData)
        .addClass("elem-note elem-" + noteData.instrument)
        .removeAttr("style")
        .html("<p>" + noteData.note + '</p><article class="ui-icon ui-icon-trash note-delete"></article>'
        + '<article class="note-tt">Added by <p>'
        + noteData.owner + '</p></article>');
    return dropnote;
  }
  function getCol(noteData) {
    return $("section.span-system[data-row=" + noteData.row + "] > .col-chord[data-col=" + noteData.col +"]");
  }




  /* SOCKET FUNCTIONS */
  socket.on("update log", function(list) {
    console.log("change received.");
    // console.log(list);
    $("#log-changes").html("")
    $.each(list, function(i, item) {
      $("#log-changes").prepend(item + (i == 0 ? "" : "<br>"));
    });
  });
  socket.on("update users", function(list) {
    $("#log-users").html("");
    $.each(list, function(i, u) {
      $("#log-users").prepend(u + ((i == 0) ? "" : ", "));
    });
  });


  socket.on("login notif", function(username) {
    var str = username + " logged in";
    $("#tt-flash").html(username + " has logged in!").fadeIn(flashDur / 2, function() {
      $(this).delay(flashDur / 1.5).fadeOut(flashDur / 2);
    });
  });

  socket.on("username error", function(roomName, error) {
    $("#modal-room").show();
    $("#input-room").val(roomName);
    $("#input-user").val("").attr("placeholder", error).focus();
  });


  socket.on("create room", function() {
    $("#modal-room").hide();
  });

  socket.on("join room", function(roomData) {
    $("#modal-room").hide();
    console.log("Duplicating notes and editables");
    for (var editable in roomData.editables) {
      if (roomData.editables.hasOwnProperty(editable)) {
        var text = roomData.editables[editable];
        $("#" + editable).html((text.length == 0 ? "Click to edit" : text));
      }
    }

    $.each(roomData.notes, function(i, noteData) {
      createNote(noteData).appendTo(getCol(noteData)).hide().fadeIn(fadeDur);
      getCol(noteData).data().notes++;
    });
  });

  /* EDITABLES */
  socket.on("editable changed", function(elemID, elemVal) {
    // console.log("change received, editing " + elemID);
    $("#" + elemID).html(elemVal);
  });
  socket.on("focusin", function(editors, tie) {
    var userstr = "";
    var count = 0;
    $.each(editors, function(user, val) {
      userstr += user + ", ";
      count++;
    });
    console.log("userstr: " + userstr);
    $("#" + tie + " > p").html(userstr.slice(0, -2));
    if (count == 1)
      $("#" + tie).fadeIn(fadeDur/2);
  });
  socket.on("focusout", function(editors, tie) {
    var userstr = "";
    var count = 0;
    var fade;
    $.each(editors, function(user, val) {
      userstr += user + ", ";
      count++;
    });
    console.log("userstr: " + userstr);

    if (count == 0)
      $("#" + tie).fadeOut(fadeDur/2);
    else
      $("#" + tie + " > p").html(userstr.slice(0, -2));

    var str = tie.replace("tt", "elem");
    var mainEle = $("#" + str);
    if (mainEle.html().length == 0)
      mainEle.html("Click to edit");
  });

  socket.on("notedrop", function(noteData) {
    console.log("note " + noteData.string + " dropped.");
    // create element
    var dropnote = createNote(noteData);
    var dropcol = getCol(noteData);
    dropnote.appendTo(dropcol).hide().fadeIn(fadeDur);
    dropcol.data().notes++;
    socket.emit("test");
    // socket.emit("update changes", socket.name + " added "
    //             + noteData.string + " to system "
    //             + noteData.row + " at beat "
    //             + noteData.col + ".");
  });

  socket.on("notedelete", function(noteData) {
    var notes = $("section.span-system[data-row=" + noteData.row + "] > section.col-chord[data-col=" + noteData.col + "] > article.elem-note.elem-" + noteData.instrument);

    $.each(notes, function(i, v) {
      var note = $(v);
      if (note.data().string == noteData.string) {
        note.parent().data().notes--;
        note.fadeOut(fadeDur, function() {
          $(this).remove();
        });
      }
    });

  });
});
