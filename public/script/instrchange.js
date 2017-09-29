$(document).ready(function() {
  $("div.row#span-notes > .span-instrTab#instr-piano").show();


  // TODO: show which tab selected
  $("div.row#span-instr > .span-instr").click(function() {
    $("div.row#span-instr > .span-instr").addClass("inactive");
    $(this).removeClass("inactive");
    var instr = $(this).data("tied");
    $("div.row#span-notes > .span-instrTab").hide();

    $("div.row#span-notes > .span-instrTab#" + instr).show();
  });
  // TODO: clone or hardcode each tab????
  // TODO: octave sliders!!!
});
