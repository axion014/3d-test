phina.define('fly.SplashLoadingScene', {
	superClass: 'phina.display.DisplayScene',

	init: function(options) {
		options = (options || {}).$safe(phina.game.LoadingScene.defaults);
		this.superInit(options);
		var texture = phina.asset.Texture();
		texture.load(phina.game.SplashScene.defaults.imageURL).then(function() {
			this.sprite = phina.display.Sprite(this.texture).addChildTo(this);
			this.sprite.setPosition(this.gridX.center(), this.gridY.center());
			this.sprite.alpha = 0;
			this.sprite.tweener.clear()
				.to({alpha:1}, 500, 'easeOutCubic').wait(1000)
				.to({alpha:0}, 500, 'easeOutCubic').wait(250)
				.call(function() {this.sprite.remove();}, this);
		}.bind(this));
		this.texture = texture;
		var loader = phina.asset.AssetLoader();
		loader.onload = function(e) {this.app.popScene();}.bind(this);
		loader.load(options.assets);
	}
});
