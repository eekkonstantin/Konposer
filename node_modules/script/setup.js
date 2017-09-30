/*
 * Copyright 2016 kkontagion
 * Contact: eekkonstantin@gmail.com
 *
 * This file is part of the Konposer project, under GNU GPLv3.
 * The files in the project are free for distribution, modification, and commercial use.
 * Any use of this file must have the copyright and license notices preserved.
 */

var instrumentKeys = {
  "instr-piano": "KB",
  "instr-guitar": "GT",
  "instr-other": "OT"
};
var midiSettings = {
  vol: 500,
  dur: 127,
  playback: 800,
  channel: {
    KB: 0,
    GT: 1,
    OT: 2
  }
};

var flashDur = 2000;
var fadeDur = 500;
var maxEditable = 40; // max number of characters for fields
var maxRows = 8; // max number of rows in the Sheet

var socket = io.connect();
var room;
var user;

$(document).ready(function() {
  $("#modal-sound p").hide();
  // ROOMS & USERNAMES
  var roomClick = function() {
    room = $("#input-room").val().toUpperCase();
    user = $("#input-user").val().toUpperCase();
    if (room.length == 0 || user.length == 0) {
      if (room.length == 0)
        $("#input-room").focus();
      else
        $("#input-user").focus();
      return false;
    }
    $("#elem-help > p#roomName").html(room);
    $("#elem-help > p#userName").html(user);
    socket.emit("room", room, user);
  };
  $("#input-room").focus();
  $("#modal-room").keypress(function(e) {
    if (e.which == 13)
      roomClick();
  }).show();
  $("#button-room").click(function() {
    roomClick();
    // $("#modal-room").hide();
  });


  var dataClone = $(".span-instrTab#instr-piano > #span-keyb").clone();
  $(".span-instrTab#instr-guitar > #span-keyb").html(dataClone.html());
  $(".span-instrTab#instr-other > #span-keyb").html(dataClone.html());

  $(".span-instrTab:not(#instr-functions)").each(function() {
    var instrID = $(this).attr("id");
    var octaveID = instrumentKeys[instrID];
    instrID = "#" + instrID;

    // sliders
    var handle = $(instrID + " #elem-octave-handle" + octaveID);
    $(instrID + " #elem-octave-slider" + octaveID).slider({
      value: 4,
      min: 0,
      max: 8,
      create: function() {
        handle.text("Octave " + $(this).slider("value"));
      }, slide: function(e, ui) {
        handle.text("Octave " + ui.value);
      }
    });

  });

  $("div.row#span-notes > .span-instrTab#instr-piano").show();

  $("div.row#span-instr > .span-instr").click(function() {
    $("div.row#span-instr > .span-instr").addClass("inactive");
    $(this).removeClass("inactive");
    var instr = $(this).data("tied");
    $("div.row#span-notes > .span-instrTab").hide();

    $("div.row#span-notes > .span-instrTab#" + instr).show();
  }); // end instr tabs


  // SETUP MIDI
  MIDI.loadPlugin({
		soundfontUrl: "script/soundfont/",
		instrument: "acoustic_grand_piano",
		onprogress: function(state, progress) {
			console.log(state, progress);
		},
		onsuccess: function() {
			// var delay = 0; // play one note every quarter second
			// var note = 50; // the MIDI note
			// var velocity = 127; // how hard the note hits
			// play the note
			MIDI.setVolume(midiSettings.channel.KB, midiSettings.vol);
			// MIDI.noteOn(0, note, velocity, delay);
			// MIDI.noteOff(0, note, delay + 0.75);

      /* OTHER INSTRUMENTS */
      MIDI.loadResource({
        instrument: "acoustic_guitar_nylon",
        onprogress: function(state, percent) {
          console.log(state, percent);
        }, onsuccess: function() {
          // 0 should be replaced by track number.
          MIDI.programChange(midiSettings.channel.GT, MIDI.GM.byName["acoustic_guitar_nylon"].number);
          MIDI.setVolume(midiSettings.channel.GT, midiSettings.vol);
        }
      });
      MIDI.loadResource({
        instrument: "xylophone",
        onprogress: function(state, percent) {
          console.log(state, percent);
        }, onsuccess: function() {
          // 0 should be replaced by track number.
          MIDI.programChange(midiSettings.channel.OT, MIDI.GM.byName["xylophone"].number);
          MIDI.setVolume(midiSettings.channel.OT, 1000);
        }
      });

      $.getScript("script/soundboard.js");
      $("#modal-sound").hide();

		}
	});

  // EXPAND/COLLAPSE
  $("div#span-expand").click(function() {
    $("#span-sheet").toggleClass("expanded");
  });


  // EDITABLE FIELDS
  $("#modal-edit > .modal-content").html("Please keep within the " + maxEditable + "-character & single-line limit.");

  $("#span-header").children("[contenteditable=true]").on("cut copy paste", function(e) {
    console.log("cut paste called");
    e.preventDefault();
  // }).on("paste", function(e) {
  //     var copy = e.originalEvent.clipboardData.getData('text/plain');
  //     console.log( );
  //     var newStr = e.originalEvent.clipboardData.getData('text/plain') + $(this).text();
  //     if (newStr.length >= maxEditable || /\r|\n/.exec(copy)) {
  //       $("#modal-edit").show().fadeOut(flashDur);
  //       e.preventDefault();
  //     } else {
  //       socket.emit("editable changed", room, $(this).attr("id"), $(this).html());
  //     }
    }).on("keypress", function(e) {
      console.log(e.keyCode);
      if (e.keyCode == 13) {
        $(this).blur();
        e.preventDefault();
      } else if ($(this).text().length >= maxEditable) {
        $("#modal-edit").show().fadeOut(flashDur);
        e.preventDefault();
      }
    }).on("keyup", function(e) {
      var len = $(this).text().length;
      if ( (e.keyCode == 8 || e.keyCode == 46) && len == 0 ) { // backspace or delete
        console.log("called");
        $(this).html("Click to edit").select();
      } else if (len < maxEditable && e.keyCode != 13) {
        socket.emit("editable changed", room, $(this).attr("id"), $(this).html());
      }
    }).focusin(function(e) {
      socket.emit("focusin", $(this).data("tied"), $(this).html());
    }).focusout(function(e) {
      if ($(this).text().length == 0)
        $(this).html("Click to edit").select();
      socket.emit("focusout", $(this).data("tied"));
    });
    // NOTE: keypress is to disable input, but it only fires before key input, so need keyup.


  // DELETION
  $(document).on("click", ".note-delete", function(e) {
    socket.emit("notedelete", room, $(this).parent().data());
    $(this).parent().parent().data().notes--;
    $(this).parent().remove();
  });


  // LOGS
  $("#elem-help").click(fadeDur, function(e) {
    $("#tt-log").slideToggle();
  });


});
