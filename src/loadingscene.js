phina.define('nfc.LoadingScene', {
	superClass: 'phina.game.LoadingScene',

	init: function(options) {
		options = (options || {}).$safe(nfc.LoadingScene.defaults).$safe(phina.game.LoadingScene.defaults);
		this.superInit(options);
		this.gauge.animationTime = options.animationtime;
	},

	_static: {
		defaults: {animationtime: 500},
	},
});
