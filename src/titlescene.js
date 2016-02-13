phina.define('nfc.TitleScene', {
	superClass: 'phina.game.TitleScene',

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
		this.on('pointstart', function() {this.exit();});
	}

});
