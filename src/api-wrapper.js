(function(global){

  var apiwrapper, api, container, frame, session, cache = {}, store = [], keepalive
    , _ = require("underscore")
    , psst = require("psst")
    ;

  // Capture the LMS API. We only need to search for it once, so we can cache it in a variable and re-use it.
  // Some SCORM API wrappers will search for the API with every SCORM command. Is it really going to move?
  api = (function(search){
    // We've made the `container` variable accessible outside of this function, as we'll
    // want to interact with the DOMWindow that holds the API.
    var self = arguments.callee;
    container = search || global;
    // If the API isn't in the current window, look backwards for it.
    if (!container.API) {
      // First, we'll try any parent frames.
      if (container.parent && container !== container.parent) {
        return self.call(this, container.parent);
      }
      // Then, any `opener` windows.
      if (container.opener !== null && (typeof container.opener !== "undefined") && !container.opener.closed) {
        return self.call(this, container.opener);
      }
    }
    if (container.parent && container.parent.frames && "SCODataFrame" in container.parent.frames) {
      frame = container.parent.frames.SCODataFrame;
    }
    // Return the API Object.
    return container.API;
  }).call(this);

  // Returns a HHHH:MM:SS
  function format_duration(start, end) {
    var duration = end - start, h, m, s;
    h = /[0-9]{4}$/.exec("000" + Math.floor(duration / 3600000));
    m = Math.floor((duration % 3600000) / 60000);
    s = Math.floor(((duration % 3600000) % 60000) / 1000);
    return [h, (m < 10 ? "0" + m : m), (s < 10 ? "0" + s : s)].join(":");
  }

  function LMSGetValue(model) {
    var value;
    if (cache[model]) { return cache[model]; }
    if (api) {
      if ((value = api.LMSGetValue(model)) && +api.LMSGetLastError() === 0) {
        cache[model] = value;
        return cache[model];
      }
    }
    return null;
  }

  function LMSSetValue(model, value) {
    cache[model] = value;
    if (!_.contains(store, model)) { store.push(model); }
    return cache[model];
  }

  function LMSGetLastError() {
    return Number(api.LMSGetLastError()) || null;
  }

  function LMSGetErrorString(errorCode) {
    return api.LMSGetErrorString(String(errorCode)) || null;
  }

  function LMSGetDiagnostic(errorCode) {
    return api.LMSGetDiagnostic(String(errorCode)) || null;
  }

  function LMSCommit() {
    var commit = false;
    if (api) {
      commit = _.every(store, function(model, index, list){
        if (api.LMSSetValue(model, cache[model]) === "true" && +api.LMSGetLastError() === 0) {
          return true;
        }
        return false;
      });
      if (commit && (store = []) && api.LMSCommit("") === "true" && +api.LMSGetLastError() === 0) {
        return commit;
      }
    }
    return commit;
  }

  function LMSInitialize() {
    if (api && api.LMSInitialize("") === "true" && /0|101/.test(+api.LMSGetLastError())) {

      // Capture when we've started communication. We'll use this timestamp to determine
      // how long a learner has been in the course.
      session = +new Date;

      // As a convenience to the developer, we'll mark the learner incomplete when the first session starts.
      if (!/(pass|complet)ed?/.test(LMSGetValue("cmi.core.lesson_status"))) {
        LMSSetValue("cmi.core.lesson_status", "incomplete");
      }

      // In PeopleSoft ELM, `LMSCommit` triggers an alert, which can be pretty annoying.
      // This will remove that (and we'll fake it in LMSFinish).
      if (frame && container.mode === "test" && "displaySuccess" in frame) {
        frame._displaySuccess = frame.displaySuccess;
        frame.displaySuccess = function(){};
      }

      if (!keepalive && typeof window !== "undefined" && global === window) {
        keepalive = global.setInterval(function(){
          LMSSetValue("cmi.core.lesson_location", LMSGetValue("cmi.core.lession_location"));
          if (!LMSCommit()) {
            global.clearInterval(keepalive);
            if (global.onLMSConnectionError) {
              global.onLMSConnectionError();
            }
          }
        }, 300000); // 5 minutes
      }

      return true;
    }
    return false;
  }

  function LMSFinish() {
    if (api) {
      // Let's track how long the user's session was.
      LMSSetValue("cmi.core.session_time", format_duration(session, +new Date));
      // LMSCommit will send anything in the cache to the LMS.
      if (LMSCommit() && (api.LMSFinish("") === "true")) {
        if (frame) {
          if (container.mode === "test" && "_displaySuccess" in frame) {
            frame._displaySuccess.call(container);
          }
          // This throws an error once in a while. Let's hide it.
          frame.cleanup = function(){};
          // Everybody goes crazy for this... This just refreshes the page, so that it
          // appears as if the status is updated in realtime.
          container.location.href = container.location.href;
        }
        return true;
      }
    }
    return false;
  }

  function to_string(fn) {
    return function(){
      return fn.apply(window, arguments).toString();
    }
  }

  apiwrapper = {

    getAPI: function () { return api; },
    findAPI: function () { return api; },
    getAPIHandle: function () { return api; },
    LMSInitialize: LMSInitialize,
    LMSCommit: LMSCommit,
    LMSFinish: LMSFinish,
    LMSGetValue: LMSGetValue,
    LMSSetValue: LMSSetValue,
    LMSGetLastError: LMSGetLastError,
    LMSGetErrorString: LMSGetErrorString,
    LMSGetDiagnostic: LMSGetDiagnostic,
    doLMSInitialize: to_string(LMSInitialize),
    doLMSCommit: to_string(LMSCommit),
    doLMSFinish: to_string(LMSFinish),
    doLMSGetValue: to_string(LMSGetValue),
    doLMSSetValue: to_string(LMSSetValue),
    doLMSGetLastError: to_string(LMSGetLastError),
    doLMSGetErrorString: to_string(LMSGetErrorString),
    doLMSGetDiagnostic: to_string(LMSGetDiagnostic)

  };

  _.extend(apiwrapper, psst);

  if (typeof define === 'function' && define.amd) {
    define(function(){ return apiwrapper; });
  } else if (typeof module !== 'undefined' && module.exports) {
    module.exports = apiwrapper;
  } else {
    global['apiwrapper'] = apiwrapper;
    if (typeof window !== 'undefined' && global === window) {
      _.extend(global, apiwrapper);
    }
  }

})(this);
