const canvas = document.querySelector("#unity-canvas");

// Only show the unity canvas when the game has loaded
// (ie never show the horrible loading screen)
// (please don't sue)
// (see callbacks.jslib in the unity project for details)
window.addEventListener('unity-loaded', () => {
  canvas.style.opacity = 1;
});

window.setUnityPointer = (pointer) => {
	canvas.style.cursor = pointer ? "pointer" : "default"
}