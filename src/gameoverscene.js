phina.define('fly.GameOverScene', {
	superClass: 'phina.display.CanvasScene',

	init: function(params) {
		this.superInit(params);

		params = (params || {}).$safe(phina.game.ResultScene.defaults);

		var message = params.message.format(params);

		this.backgroundColor = params.backgroundColor;

		this.fromJSON({
			children: {
				scoreText: {
					className: 'phina.display.Label',
					arguments: {
						text: 'score',
						fill: params.fontColor,
						stroke: null,
						fontSize: 48,
					},
					x: this.gridX.center(),
					y: this.gridY.span(4),
				},
				scoreLabel: {
					className: 'phina.display.Label',
					arguments: {
						text: '' + params.score,
						fill: params.fontColor,
						stroke: null,
						fontSize: 72,
					},
					x: this.gridX.center(),
					y: this.gridY.span(6),
				},

				playButton: {
					className: 'phina.ui.Button',
					arguments: [{
						text: 'retry',
						width: 144,
						height: 144,
						fontSize: 45,
						cornerRadius: 72,
					}],
					x: this.gridX.center(),
					y: this.gridY.span(12),

					interactive: true,
					onpush: function() {
						this.exit('main');
					}.bind(this),
				},
			}
		});
	}
});
