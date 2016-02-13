phina.define('nfc.SceneLoadingScene', {
	superClass: 'phina.display.CanvasScene',

	init: function(options) {
		options = (options || {}).$safe(nfc.SceneLoadingScene.defaults).$safe(phina.game.LoadingScene.defaults);
		this.superInit(options);
		this.fromJSON({
			children: {
				gauge: {
					className: 'phina.ui.Gauge',
					arguments: {
						value: 0,
						width: this.width,
						height: 12,
						fill: '#aaa',
						stroke: false,
						gaugeColor: 'hsla(200, 100%, 80%, 0.8)',
						padding: 0,
						animationTime: options.animationtime
					},
					x: this.gridX.center(),
					y: 0,
					originY: 0,
				}
			}
		});

		this.gauge.onfull = function() {this.removeChild(this.gauge);}.bind(this);
	},

	load: function(params, i) {
		i |= 0;
		var flow = phina.util.Flow(params[i].bind(this));
		flow.then(function() {
			i++;
			this.gauge.value = i / params.length * 100;
			if(i < params.length) {this.load(params, i);}
		}.bind(this));
	},

	_static: {
		defaults: {
			animationtime: 100
		},
	}
});
