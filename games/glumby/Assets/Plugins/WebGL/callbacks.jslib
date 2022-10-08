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
    if (window.getDumplingW) {
      return window.getDumplingW(i);
    }
  },

  /* float */ _GetDumplingH: function (/* int */ i) {
    if (window.getDumplingH) {
      return window.getDumplingH(i);
    }
  }
});
