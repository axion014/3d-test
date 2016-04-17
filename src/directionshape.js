
phina.define('fly.DirectionShape', {
	superClass: 'phina.display.Shape',

	init: function(options) {
		options = ({}).$safe(options, {
			backgroundColor: 'transparent',
			fill: '#ff5050',
			stroke: '#aaa',
			strokeWidth: 2,

			width: 16,
			height: 32
		});
		this.superInit(options);
	},

	prerender: function(canvas) {
		canvas.beginPath()
			.moveTo(0, this.height)
			.lineTo(this.width, -this.height)
			.lineTo(-this.width, -this.height)
			.closePath();
	}
});
