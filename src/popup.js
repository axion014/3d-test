phina.define('fly.Popup', {
	superClass: 'phina.display.Shape',
	init: function(options) {
    options = ({}).$safe(options, {
			backgroundColor: 'transparent',
			fill: 'hsla(0, 0%, 0%, 0.6)',
			stroke: null,
			strokeWidth: 2,

			width: 512,
			height: 48,
			sideIndent: 32
		});
    this.superInit(options);
		this.sideIndent = options.sideIndent;
		this.label = phina.display.Label(options.label).addChildTo(this);
	},
	prerender: function(canvas) {
		var w = this.width / 2;
		var h = this.height / 2;
		canvas.beginPath()
			.moveTo(-w, -h)
			.lineTo(this.sideIndent - w, 0)
			.lineTo(-w, h)
			.lineTo(w, h)
			.lineTo(w - this.sideIndent, 0)
			.lineTo(w, -h)
			.closePath();
	}
});
