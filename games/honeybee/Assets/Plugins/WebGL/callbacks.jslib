mergeInto(LibraryManager.library, {
  _OnStart: function () {
    // TODO: will this work if there's multiple unity iframes on the same page?
    window.dispatchEvent(new Event('unity-loaded'));
  },

  _SetPointer: function (/* bool */ pointer) {
    if (window.setUnityPointer) {
      window.setUnityPointer(pointer);
    }
  }
});
