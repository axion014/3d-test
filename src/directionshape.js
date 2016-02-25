
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

	render: function(canvas) {
		canvas.clearColor(this.backgroundColor);
		canvas.transformCenter();

		if (this.fill) {
			canvas.fillStyle = this.fill;
			canvas.beginPath();
			canvas.moveTo(0, this.height);
			canvas.lineTo(this.width, -this.height);
			canvas.lineTo(-this.width, -this.height);
			canvas.closePath();
			canvas.fill();
		}

		if (this.isStrokable()) {
			canvas.lineWidth = this.strokeWidth;
			canvas.strokeStyle = this.stroke;
			canvas.beginPath();
			canvas.moveTo(0, this.height);
			canvas.lineTo(this.width, -this.height);
			canvas.lineTo(-this.width, -this.height);
			canvas.closePath();
			canvas.stroke();
		}
	},
});
