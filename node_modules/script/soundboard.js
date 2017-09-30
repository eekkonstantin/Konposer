/*
 * Copyright 2016 kkontagion
 * Contact: eekkonstantin@gmail.com
 *
 * This file is part of the Konposer project, under GNU GPLv3.
 * The files in the project are free for distribution, modification, and commercial use.
 * Any use of this file must have the copyright and license notices preserved.
 */

var noteKeys = { "C9": 0x78, "B8": 0x77, "Bb8": 0x76, "A8": 0x75, "Ab8": 0x74,
"G8": 0x73, "Gb8": 0x72, "F8": 0x71, "E8": 0x70, "Eb8": 0x6F, "D8": 0x6E, "Db8": 0x6D,
"C8": 0x6C, "B7": 0x6B, "Bb7": 0x6A, "A7": 0x69, "Ab7": 0x68, "G7": 0x67, "Gb7": 0x66,
"F7": 0x65, "E7": 0x64, "Eb7": 0x63, "D7": 0x62, "Db7": 0x61, "C7": 0x60, "B6": 0x5F,
"Bb6": 0x5E, "A6": 0x5D, "Ab6": 0x5C, "G6": 0x5B, "Gb6": 0x5A, "F6": 0x59, "E6": 0x58,
"Eb6": 0x57, "D6": 0x56, "Db6": 0x55, "C6": 0x54, "B5": 0x53, "Bb5": 0x52, "A5": 0x51,
"Ab5": 0x50, "G5": 0x4F, "Gb5": 0x4E, "F5": 0x4D, "E5": 0x4C, "Eb5": 0x4B, "D5": 0x4A,
"Db5": 0x49, "C5": 0x48, "B4": 0x47, "Bb4": 0x46, "A4": 0x45, "Ab4": 0x44, "G4": 0x43,
"Gb4": 0x42, "F4": 0x41, "E4": 0x40, "Eb4": 0x3F, "D4": 0x3E, "Db4": 0x3D, "C4": 0x3C,
"B3": 0x3B, "Bb3": 0x3A, "A3": 0x39, "Ab3": 0x38, "G3": 0x37, "Gb3": 0x36, "F3": 0x35,
"E3": 0x34, "Eb3": 0x33, "D3": 0x32, "Db3": 0x31, "C3": 0x30, "B2": 0x2F, "Bb2": 0x2E,
"A2": 0x2D, "Ab2": 0x2C, "G2": 0x2B, "Gb2": 0x2A, "F2": 0x29, "E2": 0x28, "Eb2": 0x27,
"D2": 0x26, "Db2": 0x25, "C2": 0x24, "B1": 0x23, "Bb1": 0x22, "A1": 0x21, "Ab1": 0x20,
"G1": 0x1F, "Gb1": 0x1E, "F1": 0x1D, "E1": 0x1C, "Eb1": 0x1B, "D1": 0x1A, "Db1": 0x19,
"C1": 0x18, "B0": 0x17, "Bb0": 0x16, "A0": 0x15, "Ab0": 0x14, "G0": 0x13, "Gb0": 0x12,
"F0": 0x11, "E0": 0x10, "Eb0": 0x0F, "D0": 0x0E, "Db0": 0x0D, "C0": 0x0C };

var playSrc ="style/images/play.png";
var stopSrc ="style/images/stop.png";
var magicNumber = 7; // multiplier for playback note duration
var keyColors = {
  white: "black",
  black: "#EEC957"
};
function addNote(note, column, fade) {
  note.appendTo(column);
  if (fade)
    note.hide().fadeIn(500);
  column.data().notes++;
}

$(document).ready(function() {
  function getInstrKey(elem) {
    return instrumentKeys[elem.parents("div.span-instrTab").attr("id")]
  }
  function octaveVal(elem) {
    var instr = elem.parents("div.span-instrTab").attr("id");
    var instrkey = instrumentKeys[instr];
    return $("#elem-octave-slider" + instrkey).slider("value");
  }

  function playKeyboard(elem) {
    var instrkey = getInstrKey(elem);
    var octave = octaveVal(elem);
    var play = elem.data("key") + octave;
    // console.log(play);
    playNote(instrkey, play);
  }
  function playNote(instrkey, play) {
    MIDI.noteOn(midiSettings.channel[instrkey], noteKeys[play], 127, 0); // channel, note, speed, delay
    MIDI.noteOff(midiSettings.channel[instrkey], noteKeys[play], 127);
  }
  function keyFeedback(ele) {
    var orig = keyColors[(ele.hasClass("white") ? "white" : "black")];
    if (ele.hasClass("span-bw") && ele.hasClass("white")) {
      var getKey = ele.data("key");
      var uncleSam = ele.parents("#span-keyb").children("#span-w");
      ele = uncleSam.children("[data-key=" + getKey + "]");
    }
    var colorMe = ele.parents(".span-instrTab").css("background-color");
    ele.css("color", colorMe);
    setTimeout(function() {
      ele.css("color", orig);
    }, fadeDur);
  }


  /* PLAY NOTES ON CLICK */
  $(document).on("click", ".white, .black", function(e) {
    playKeyboard($(this));
    keyFeedback($(this));
  });
  $(document).on("click", ".elem-note", function(e) {
    if (!$(e.target).hasClass("note-delete")) {
      var instrkey = $(this).data("instrument");
      var note = $(this).data("note");
      playNote(instrkey, note);
    }
  });

  /* DRAG NOTES */
  var dragmenote = $("#dragmenote");
  var dragdata = {};
  $(".white:not(:first-of-type), .black").draggable({
    scroll: false,
    cursor: "move",
    cursorAt: { top: -12, left: -20},
    revert: 'invalid',
    start: function(e) {
      playKeyboard($(this));
      keyFeedback($(this));
      var note = $(this).data("key") + octaveVal($(this));
      var instrument = getInstrKey($(this));
      dragmenote.children("p").html(note);
      dragmenote.removeClass()
                .addClass("elem-note elem-" + instrument);
      dragdata = {
        "note": note,
        "instrument": instrument,
        "string": note + "-" + instrument // for checking exists
      };
      console.log(dragmenote);
    },
    helper: function(e) {
      return dragmenote.show();
    }
  });
  /* END drag notes */


  /* DROP NOTES */
  // disabling drops over the keyboard
  $("#span-notes, #span-expand").droppable({
    tolerance: 'pointer',
    over: function() {
      console.log("#SUPER TRIGGERED");
      $(".col-chord").droppable("disable");
    },
    out: function() {
      console.log("byebye");
      $(".col-chord").droppable("enable");
    }
  });

  $(".col-chord").droppable({
    tolerance: 'pointer',
    drop: function(e, item) {
      var dropcol = $(e.target);
      // console.log(dropcol);
      dragdata["col"] = dropcol.data("col");
      dragdata["row"] = dropcol.parent().data("row");
      dragdata["owner"] = user;
      var dropnote = item.helper.clone()
            .removeClass() // removes all ui classes
            .addClass("elem-note elem-" + dragdata.instrument)
            .removeAttr("id")
            .removeAttr("style")
            .data(dragdata);
      dropnote.children(".note-tt").children("p").html(user);

      // check if note exists in col
      if (dropcol.data().notes < 5) {
        var exists = false;
        $(this).children(".elem-note").each(function(i, elem) {
          if ($(elem).data("string") == dropnote.data("string") ) {
            exists = true;
            return false;
          }
        });

        if (!exists) {
          addNote(dropnote, dropcol, false);
          // TODO: drag between columns?
          console.log({"SENDING" : dropnote.data()});
          socket.emit("notedrop", room, dropnote.data());
        } else {
          console.log(dropnote.data().string + " already exists.");
          $("#modal-note > .modal-content").html("This note is already in this beat!");
          $("#modal-note").show().fadeOut(flashDur);
        }
      } else {
        console.log("Max reached.");
        $("#modal-note > .modal-content").html("Maximum of 5 notes per beat!");
        $("#modal-note").show().fadeOut(flashDur);
      }
    }
  });


  /* END drop notes */


  // SPEED SLIDER
  var handle = $("#elem-pbSpeed-handle");
  $("#elem-pbSpeed-slider").slider({
    value: 75,
    min: 40,
    max: 300,
    create: function() {
      handle.text($(this).slider("value"));
    }, slide: function(e, ui) {
      midiSettings.playback = 60 / ui.value * 1000;
      handle.text(ui.value);
    }
  });


  // DOWNLOADING AND PLAYBACK
  var playing = false;
  var playFn, stopFn;
  var stopper = function() {
    console.log("playback finished.");
    // remove all .playing
    $("#span-music .col-chord").removeClass("playing");
    $(".instr-functions > img[data-fn=play]").attr('src', playSrc);
    playing = false;
  };
  $(".instr-functions > img").click(function(e) {
    var fn = $(e.target).data().fn;
    if (fn == "download")
      socket.emit("savefile");
    else if (fn == "play") {

      if (playing) {

        // stop playback
        MIDI.stopAllNotes();
        /* NOTE: MIDI.js has been edited at line 1183/4 to make this work. */
        clearTimeout(playFn);
        clearTimeout(stopFn);
        stopper();

        // remove classes
        $("#span-music .col-chord.playing").removeClass("playing");

        // change icon back to "play"
        $(this).attr('src', playSrc);
      } else {
        playing = true;
        console.log("play clicked");
        // change icon to "stop"
        $(this).attr('src', stopSrc);

        var i = 0;
        var cols = $("#span-music .col-chord");

        // change icon back to "play"
        var btn = $(this);
        stopFn = setTimeout(function() {
          stopper();
        }, midiSettings.playback * cols.length + 4);


        // start playback
        var playback = function() {
          if (i < cols.length) {
            var col = cols.eq(i);
            cols.removeClass("playing");
            col.addClass("playing");

            // get notes
            if (col.data("notes") > 0) {
              var instr = {
                KB: [],
                GT: [],
                OT: []
              };
              col.children(".elem-note").each(function() {
                var noteData = $(this).data();
                instr[noteData.instrument].push(noteKeys[noteData.note]);
              });
              $.each(instr, function(k, v) {
                MIDI.chordOn(midiSettings.channel[k], v, midiSettings.playback/7);
              });
            }
            i++;
            playFn = setTimeout(playback, midiSettings.playback);
          }
        };
        playback();


      } // END playing ? :
    } // END fn checking
  }); // END img clicking



});
