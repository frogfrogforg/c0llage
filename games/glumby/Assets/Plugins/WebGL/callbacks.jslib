mergeInto(LibraryManager.library, {
  _OnStart: function () {
    // TODO: will this work if there's multiple unity iframes on the same page?
    console.log("raise unity-loaded");
    window.dispatchEvent(new Event('unity-loaded'));
  },

  _SetPointer: function (/* bool */ pointer) {
    if (window.setUnityPointer) {
      window.setUnityPointer(pointer);
    }
  },

  /* int */ _GetNDumplings: function () {
    if (window.getNDumplings) {
      return window.getNDumplings();
    }
  },

  /* float */ _GetDumplingX: function (/* int */ i) {
    if (window.getDumplingX) {
      return window.getDumplingX(i);
    }
  },

  /* float */ _GetDumplingY: function (/* int */ i) {
    if (window.getDumplingY) {
      return window.getDumplingY(i);
    }
  },

  /* float */ _GetDumplingW: function (/* int */ i) {
   // console.log("called _GetDumplingW from Unity");
    if (window.getDumplingW) {
     // console.log("calling window.getDumplingW in JS");
      return window.getDumplingW(i);
    }
  },

  /* float */ _GetDumplingH: function (/* int */ i) {
    if (window.getDumplingH) {
      return window.getDumplingH(i);
    }
  },

  /* bool */ _IsGlumbyDumplingOpen: function () {
    if (window.isGlumbyDumplingOpen) {
      return window.isGlumbyDumplingOpen();
    }
  },

  /* float */ _GetGlumbyDumplingX: function () {
    if (window.getGlumbyDumplingX) {
      return window.getGlumbyDumplingX();
    }
  },

  /* float */ _GetGlumbyDumplingY: function () {
    if (window.getGlumbyDumplingY) {
      return window.getGlumbyDumplingY();
    }
  },

  /* float */ _GetGlumbyDumplingW: function () {
    if (window.getGlumbyDumplingW) {
      return window.getGlumbyDumplingW();
    }
  },

  /* float */ _GetGlumbyDumplingH: function () {
    if (window.getGlumbyDumplingH) {
      return window.getGlumbyDumplingH();
    }
  }
  
});
