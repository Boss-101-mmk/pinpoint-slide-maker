/* Boot order: data and renderers are already loaded; this wires the page. */
(function (root) {
  'use strict';
  var PP = root.PP;
  try {
    PP.initTemplates();
    PP.initIngest();
    PP.initDesigner();
    PP.initMedia();
    PP.initAssistant();
    PP.initStorage();
    PP.initStage();
    PP.initExport();
  } catch (e) {
    console.error(e);
    var t = document.getElementById('toast');
    if (t) t.textContent = 'PinPoint failed to start. ' + (e && e.message ? e.message : '');
  }
})(typeof window !== 'undefined' ? window : globalThis);
