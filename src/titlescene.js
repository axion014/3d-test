phina.define('fly.TitleScene', {
	superClass: 'phina.game.TitleScene',

	bgbright: 64,

	init: function(params) {
		this.superInit(params);
		this.fromJSON({
			children: {
				messageLabel: {
					className: 'phina.display.Label',
					arguments: {
						text: params.message,
						fill: params.fontColor,
						stroke: false,
						fontSize: 24,
					},
					x: this.gridX.center(),
					y: this.gridY.span(12),
				}
			}
		});
		this.on('pointstart', function() {this.clicked = true;});
	},

	update: function() {
		if (this.clicked) {
			if (this.bgbright === 100) {this.exit();}
			this.bgbright += 4;
			this.backgroundColor = 'hsl(200, 80%, ' + this.bgbright + '%)';
		}
	}

});
