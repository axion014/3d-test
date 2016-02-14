
phina.define('nfc.DirectionShape', {
	superClass: 'phina.display.Shape',

	init: function(options) {
		options = ({}).$safe(options, {
			backgroundColor: 'transparent',
			fill: '#ff5050',
			stroke: '#aaa',
			strokeWidth: 2,

			radiusshort: 16,
			radiuslong: 32
		});
		this.superInit(options);
	},

	render: function(canvas) {
		canvas.clearColor(this.backgroundColor);
		canvas.transformCenter();

		if (this.fill) {
			canvas.context.fillStyle = this.fill;
			canvas.beginPath();
			canvas.moveTo(0, this.radiuslong);
			canvas.lineTo(this.radiusshort, -this.radiuslong);
			canvas.lineTo(-this.radiusshort, -this.radiuslong);
			canvas.lineTo(0, this.radiuslong);
			canvas.closePath();
			canvas.fill();
		}
		if (this.stroke && 0 < this.strokeWidth) {
			canvas.context.lineWidth = this.strokeWidth;
			canvas.strokeStyle = this.stroke;
			canvas.stroke();
		}
	},
	_defined: function() {
		phina.display.Shape.watchRenderProperty.call(this, 'radiusshort');
		phina.display.Shape.watchRenderProperty.call(this, 'radiuslong');
	}
});
