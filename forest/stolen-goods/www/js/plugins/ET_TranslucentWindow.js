//=============================================================================
// ET_TranslucentWindow.js
//=============================================================================

/*:
 * @plugindesc Change the translucentcy of Standard Windows.
 * @author Eivind Teig
 *
 * @param Opacity
 * @desc The translucentcy of the standard windows, range from 0-255
 * @default 192
 */

(function() {
    var parameters = PluginManager.parameters('ET_TranslucentWindow');
    var opacity = Number(parameters['Opacity'] || 192);	

    Window_Base.prototype.standardBackOpacity = function() {
    return opacity;
    };
    
})();
