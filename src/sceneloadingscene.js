phina.define('nfc.SceneLoadingScene', {
	superClass: 'phina.display.CanvasScene',

	init: function(options) {
		options = (options || {}).$safe(nfc.SceneLoadingScene.defaults)
		this.superInit(options);
		this.options = options;
	},

	load: function(params, i) {
		i |= 0;
		if (i === 0) {
			this.label = phina.display.Label({
				text: 'Loading... ' + 0 + '%',
				fill: 'hsla(0, 0%, 0%, 0.6)',
				fontSize: 12,
			});
			this.label.setPosition({x: SCREEN_CENTER_X, y: SCREEN_CENTER_Y});
		}
		var flow = phina.util.Flow(params[i].bind(this));
		flow.then(function() {
			this.label.text = 'Loading... ' + ++i / params.length * 100 + '%';
			if(i < params.length) {this.load(params, i);} else {this.removeChild(this.label);}
		}.bind(this));
	},

	_static: {
		defaults: {
			animationTime: 100
		},
	}
});
