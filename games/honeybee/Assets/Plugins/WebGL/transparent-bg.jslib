// Source: http://forum.unity3d.com/threads/webgl-transparent-background.284699/#post-1880667
// Clears the WebGL context alpha so you can have a transparent Unity canvas above DOM content
// Add this .jslib to your project et voila!
var LibraryGLClear = {
		glClear: function(mask)
		{
				if (mask == 0x00004000)
				{
						var v = GLctx.getParameter(GLctx.COLOR_WRITEMASK);
						if (!v[0] && !v[1] && !v[2] && v[3])
								// We are trying to clear alpha only -- skip.
								return;
				}
				GLctx.clear(mask);
		}
};

mergeInto(LibraryManager.library, LibraryGLClear);