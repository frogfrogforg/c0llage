/*:
 * @plugindesc Skips title screen ftw
 * @author SumRnmDde
 * @param Allow Title Return?
 * @desc Determines whether the player can go to the title screen though in game menu
 * @default yes
 * @help No help
 */

var parameters = PluginManager.parameters('skiptitlescreen')

var allowReturn = String(parameters['Allow Title Return?']||'Yes')

 Scene_Boot.prototype.start = function() {
    Scene_Base.prototype.start.call(this);
    SoundManager.preloadImportantSounds();
    if (DataManager.isBattleTest()) {
        DataManager.setupBattleTest();
        SceneManager.goto(Scene_Battle);
    } else if (DataManager.isEventTest()) {
        DataManager.setupEventTest();
        SceneManager.goto(Scene_Map);
    } else {
        this.checkPlayerLocation();
        // SceneManager.goto(Scene_Title);
        // Window_TitleCommand.initCommandPosition();
        DataManager.setupNewGame();
        SceneManager.goto(Scene_Map);
    }
    this.updateDocumentTitle();
};

Scene_GameEnd.prototype.commandToTitle = function() {
    this.fadeOutAll();
    if(allowReturn == 'Yes')
    {
    	SceneManager.goto(Scene_Title);
    }
    else
    {
    	DataManager.setupNewGame();
        SceneManager.goto(Scene_Map);
    }
    // SceneManager.goto(Scene_Title);
    };

    var aliasPluginCommand = Game_Interpreter.prototype.pluginCommand;
    Game_Interpreter.prototype.pluginCommand = function(command, args)
    {
    	aliasPluginCommand.call(this, command, args);
    	if(command == 'something')
    	{
    		$gameMessage.add('This is a message from the plugin comandas');
    	}

    }